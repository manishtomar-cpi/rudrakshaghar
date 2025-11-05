import { OrdersRepo } from "../repositories/orders.repo";
import { PaymentsRepo } from "../repositories/payments.repo";
import { ShipmentsRepo } from "../repositories/shipments.repo";
import { AuditService } from "../services/audit.service";
import { AppError } from "../utils/errors";

export type OrderStatus =
  | "PLACED" | "PAYMENT_SUBMITTED" | "PAYMENT_CONFIRMED"
  | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export class OrdersService {
  constructor(
    private readonly orders: OrdersRepo,
    private readonly payments: PaymentsRepo,
    private readonly shipments: ShipmentsRepo,
    private readonly audit: AuditService,
    private readonly paymentsSvc: { confirm: Function; reject: Function },
    private readonly shipmentsSvc: { upsertShipmentAndShip: Function; markDelivered: Function }
  ) {}

  async list(params: any) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    return this.orders.list({ ...params, page, limit });
  }

  async getDetail(orderId: string) {
    const order = await this.orders.getById(orderId);
    if (!order) return null;
    const items = await this.orders.listItems(orderId);
    const payment = await this.payments.getByOrderId(orderId);
    const shipment = await this.shipments.getByOrderId(orderId);

    const timeline = this.buildTimeline(order, payment, shipment);
    return { order, items, payment, shipment, timeline };
  }

  async updateStatus(orderId: string, next: OrderStatus, actorUserId: string, reason?: string) {
    const current = await this.orders.getById(orderId);
    if (!current) throw new AppError("NOT_FOUND", 404, "Order not found");

    switch (next) {
      case "PACKED":
        if (current.status !== "PAYMENT_CONFIRMED") {
          throw new AppError("CONFLICT", 409, "Order must be PAYMENT_CONFIRMED to pack");
        }
        break;
      case "CANCELLED":
        if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(current.status)) {
          throw new AppError("CONFLICT", 409, "Cannot cancel shipped/delivered/cancelled order");
        }
        break;
      default:
        throw new AppError("BAD_REQUEST", 400, "Unsupported manual status transition");
    }

    return this.orders.tx(async (tx) => {
      const before = current;
      const after = await this.orders.updateStatusTx(tx, orderId, next);

      const audit = new AuditService(tx as any);
      await audit.append({
        actorUserId,
        entity: "order",
        entityId: orderId,
        action: next === "PACKED" ? "PACK" : "CANCEL",
        before,
        after,
      });

      if (next === "PACKED") {
        await this.orders.enqueueNotificationTx(tx, {
          template_key: "order_packed",
          to_address: current.ship_phone ?? "",
          payload: { order_number: current.order_number },
        });
      }
      if (next === "CANCELLED") {
        await this.orders.enqueueNotificationTx(tx, {
          template_key: "order_cancelled",
          to_address: current.ship_phone ?? "",
          payload: { order_number: current.order_number, reason: reason ?? null },
        });
      }

      return { order: after };
    });
  }

  private buildTimeline(order: any, payment: any, shipment: any) {
    const t: Array<{ code: string; at: string | null }> = [];
    t.push({ code: "PLACED", at: order.created_at });
    if (payment?.submitted_at) t.push({ code: "PAYMENT_SUBMITTED", at: payment.submitted_at });
    if (payment?.verified_at && payment.status === "CONFIRMED") {
      t.push({ code: "PAYMENT_CONFIRMED", at: payment.verified_at });
    }
    if (order.status === "PACKED") t.push({ code: "PACKED", at: order.updated_at });
    if (shipment?.shipped_at) t.push({ code: "SHIPPED", at: shipment.shipped_at });
    if (shipment?.delivered_at) t.push({ code: "DELIVERED", at: shipment.delivered_at });
    if (order.status === "CANCELLED") t.push({ code: "CANCELLED", at: order.updated_at });
    return t;
  }
}
