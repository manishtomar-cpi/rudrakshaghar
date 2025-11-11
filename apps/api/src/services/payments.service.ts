import { OrdersRepo } from "../repositories/orders.repo";
import { PaymentsRepo } from "../repositories/payments.repo";
import { AuditService } from "./audit.service";
import { AppError } from "../utils/errors";

export class PaymentsService {
  constructor(
    private readonly orders: OrdersRepo,
    private readonly payments: PaymentsRepo,
    private readonly audit: AuditService
  ) {}

  async list(params: any) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    return this.payments.list({ ...params, page, limit });
  }

  async confirm(orderId: string, body: { utr?: string; notes?: string }, actorUserId: string) {
    const { payment, order } = await this.guardForAction(orderId);

    if (payment.status !== "SUBMITTED") {
      throw new AppError("CONFLICT", 409, "Only SUBMITTED payments can be confirmed");
    }
    if (order.status !== "PAYMENT_SUBMITTED") {
      throw new AppError("CONFLICT", 409, "Order must be PAYMENT_SUBMITTED to confirm");
    }

    return this.payments.tx(async (tx) => {
      const beforePay = payment;
      const beforeOrder = order;

      const updatedPay = await this.payments.updateStatusTx(
        tx,
        payment.id,
        "CONFIRMED",
        {
          verified_at: new Date(),
          verified_by: actorUserId,
          reference_text: body.utr ?? payment.reference_text ?? null,
        }
      );

      const updatedOrder = await this.orders.updateStatusesTx(
        tx,
        order.id,
        { payment_status: "CONFIRMED", status: "PAYMENT_CONFIRMED" }
      );

      const audit = new AuditService(tx as any);
      await audit.append({
        actorUserId,
        entity: "payment",
        entityId: payment.id,
        action: "CONFIRM_PAYMENT",
        before: beforePay,
        after: updatedPay,
      });
      await audit.append({
        actorUserId,
        entity: "order",
        entityId: order.id,
        action: "CONFIRM_PAYMENT",
        before: beforeOrder,
        after: updatedOrder,
      });

      await this.orders.enqueueNotificationTx(tx, {
        template_key: "payment_confirmed",
        to_address: order.ship_phone ?? "",
        payload: { order_number: order.order_number },
      });

      return { order: updatedOrder, payment: updatedPay };
    });
  }

  async reject(orderId: string, reason: string, actorUserId: string) {
    const { payment, order } = await this.guardForAction(orderId);

    if (payment.status !== "SUBMITTED") {
      throw new AppError("CONFLICT", 409, "Only SUBMITTED payments can be rejected");
    }

    return this.payments.tx(async (tx) => {
      const beforePay = payment;
      const beforeOrder = order;

      const updatedPay = await this.payments.updateStatusTx(
        tx,
        payment.id,
        "REJECTED",
        { rejection_reason: reason }
      );

      const updatedOrder = await this.orders.updateStatusesTx(
        tx,
        order.id,
        { payment_status: "REJECTED", status: "PAYMENT_SUBMITTED" }
      );

      const audit = new AuditService(tx as any);
      await audit.append({
        actorUserId,
        entity: "payment",
        entityId: payment.id,
        action: "REJECT_PAYMENT",
        before: beforePay,
        after: updatedPay,
      });
      await audit.append({
        actorUserId,
        entity: "order",
        entityId: order.id,
        action: "REJECT_PAYMENT",
        before: beforeOrder,
        after: updatedOrder,
      });

      await this.orders.enqueueNotificationTx(tx, {
        template_key: "payment_rejected",
        to_address: order.ship_phone ?? "",
        payload: { order_number: order.order_number, reason },
      });

      return { order: updatedOrder, payment: updatedPay };
    });
  }

  private async guardForAction(orderId: string) {
    const order = await this.orders.getById(orderId);
    if (!order) throw new AppError("NOT_FOUND", 404, "Order not found");

    const payment = await this.payments.getByOrderId(orderId);
    if (!payment) throw new AppError("CONFLICT", 409, "Payment record missing for order");

    return { order, payment };
  }

  // ✅ NEW
  async listRejectReasons(): Promise<string[]> {
    return this.payments.listRejectReasons();
  }
}
