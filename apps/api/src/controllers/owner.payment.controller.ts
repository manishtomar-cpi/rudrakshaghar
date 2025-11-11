import { Request, Response } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import { OrdersRepo } from "../repositories/orders.repo";
import { PaymentsRepo } from "../repositories/payments.repo";
import { OrdersService } from "../services/orders.service";
import { PaymentsService } from "../services/payments.service";
import { AuditService } from "../services/audit.service";
import { ShipmentsRepo } from "../repositories/shipments.repo";
import { ShipmentsService } from "../services/shipments.service";
import { listPaymentsQuerySchema, paymentConfirmSchema, paymentRejectSchema } from "../validators/payments.schema";
import { AppError } from "../utils/errors";
import { DashboardService } from "../services/dashboard.service";

function getActorUserId(req: Request): string {
  const id = (req as any)?.user?.userId;
  if (!id) throw new AppError("UNAUTHORIZED", 401, "Missing actor");
  return String(id);
}

export class OwnerPaymentController {
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
    return { paymentsSvc, ordersSvc, dash };
  }

  static async list(req: Request, res: Response) {
    const parsed = listPaymentsQuerySchema.parse(req.query);
    const { paymentsSvc, dash } = await OwnerPaymentController.deps();

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

    const result = await paymentsSvc.list({
      ...parsed,
      from,
      to,
    });
    return res.json(result);
  }

  static async confirm(req: Request, res: Response) {
    const orderId = req.params.orderId;
    const body = paymentConfirmSchema.parse(req.body);
    const actorUserId = getActorUserId(req);

    const { paymentsSvc } = await OwnerPaymentController.deps();
    const result = await paymentsSvc.confirm(orderId, body, actorUserId);
    return res.json(result);
  }

  static async reject(req: Request, res: Response) {
    const orderId = req.params.orderId;
    const body = paymentRejectSchema.parse(req.body);
    const actorUserId = getActorUserId(req);

    const { paymentsSvc } = await OwnerPaymentController.deps();
    const result = await paymentsSvc.reject(orderId, body.reason, actorUserId);
    return res.json(result);
  }

  // ✅ NEW
  static async rejectReasons(_req: Request, res: Response) {
    const { paymentsSvc } = await OwnerPaymentController.deps();
    const items = await paymentsSvc.listRejectReasons();
    return res.json({ items });
  }
}
