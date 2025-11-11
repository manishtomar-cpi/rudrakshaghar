import { Request, Response } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import { OrdersRepo } from "../repositories/orders.repo";
import { PaymentsRepo } from "../repositories/payments.repo";
import { ShipmentsRepo } from "../repositories/shipments.repo";
import { OrdersService } from "../services/orders.service";
import { PaymentsService } from "../services/payments.service";
import { ShipmentsService } from "../services/shipments.service";
import { AuditService } from "../services/audit.service";
import { listOrdersQuerySchema, orderStatusPatchSchema, shipmentPatchSchema } from "../validators/orders.schema";
import { AppError } from "../utils/errors";
import { DashboardService } from "../services/dashboard.service";

function getActorUserId(req: Request): string {
  const id = (req as any)?.user?.userId;
  if (!id) throw new AppError("UNAUTHORIZED", 401, "Missing actor");
  return String(id);
}

export class OwnerOrderController {
  private static async deps() {
    await ensureDbConnected();
    const db = getDb();
    const ordersRepo = new OrdersRepo(db);
    const paymentsRepo = new PaymentsRepo(db);
    const shipmentsRepo = new ShipmentsRepo(db);
    const audit = new AuditService(db);
    const paymentsSvc = new PaymentsService(ordersRepo, paymentsRepo, audit);
    const shipmentsSvc = new ShipmentsService(ordersRepo, shipmentsRepo, audit);
    const ordersSvc = new OrdersService(ordersRepo, paymentsRepo, shipmentsRepo, audit, paymentsSvc, shipmentsSvc);
    const dash = new DashboardService(db);
    return { ordersSvc, shipmentsSvc, dash };
  }

  static async list(req: Request, res: Response) {
    const parsed = listOrdersQuerySchema.parse(req.query);
    const { ordersSvc, dash } = await OwnerOrderController.deps();

    // enrich from/to via dashboard window if range present
    let from = parsed.from;
    let to = parsed.to;
    if (parsed.range) {
      const win = dash.computeWindow({
        range: parsed.range,
        from: parsed.from,
        to: parsed.to,
        tz: parsed.tz,
        limit: 5,
        include: new Set(),
      } as any);
      from = win.fromIso;
      to = win.toIso;
    }

    const result = await ordersSvc.list({
      ...parsed,
      from,
      to,
    });
    return res.json(result);
  }

  static async get(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new AppError("BAD_REQUEST", 400, "Missing order id");
    const { ordersSvc } = await OwnerOrderController.deps();
    const data = await ordersSvc.getDetail(id);
    if (!data) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Order not found" } });
    return res.json(data);
  }

  static async updateStatus(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new AppError("BAD_REQUEST", 400, "Missing order id");
    const body = orderStatusPatchSchema.parse(req.body);
    const actorUserId = getActorUserId(req);

    const { ordersSvc } = await OwnerOrderController.deps();
    const updated = await ordersSvc.updateStatus(id, body.status, actorUserId, body.reason);
    return res.json(updated);
  }

  static async upsertShipment(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new AppError("BAD_REQUEST", 400, "Missing order id");
    const body = shipmentPatchSchema.parse(req.body);
    const actorUserId = getActorUserId(req);

    const { shipmentsSvc } = await OwnerOrderController.deps();
    const updated = await shipmentsSvc.upsertShipmentAndShip(id, body, actorUserId);
    return res.json(updated);
  }

  static async markDelivered(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new AppError("BAD_REQUEST", 400, "Missing order id");
    const actorUserId = getActorUserId(req);

    const { shipmentsSvc } = await OwnerOrderController.deps();
    const updated = await shipmentsSvc.markDelivered(id, actorUserId);
    return res.json(updated);
  }
}
