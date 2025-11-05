import { OrdersRepo } from "../repositories/orders.repo";
import { ShipmentsRepo } from "../repositories/shipments.repo";
import { AuditService } from "./audit.service";
import { AppError } from "../utils/errors";

export class ShipmentsService {
  constructor(
    private readonly orders: OrdersRepo,
    private readonly shipments: ShipmentsRepo,
    private readonly audit: AuditService
  ) {}

  async upsertShipmentAndShip(
    orderId: string,
    body: { courier_name: string; awb_number: string; tracking_url?: string },
    actorUserId: string
  ) {
    const order = await this.orders.getById(orderId);
    if (!order) throw new AppError("NOT_FOUND", 404, "Order not found");
    if (order.status !== "PACKED") throw new AppError("CONFLICT", 409, "Order must be PACKED to ship");

    return this.shipments.tx(async (tx) => {
      const beforeOrder = order;
      const existing = await this.shipments.getByOrderIdTx(tx, orderId);

      const updatedShipment = await this.shipments.upsertTx(tx, orderId, {
        courier_name: body.courier_name,
        awb_number: body.awb_number,
        tracking_url: body.tracking_url ?? null,
        shipped_at: new Date(),
      });

      const updatedOrder = await this.orders.updateStatusTx(tx, orderId, "SHIPPED");

      const audit = new AuditService(tx as any);
      await audit.append({
        actorUserId,
        entity: "shipment",
        entityId: updatedShipment.id,
        action: existing ? "UPDATE_SHIPMENT" : "CREATE_SHIPMENT",
        before: existing,
        after: updatedShipment,
      });
      await audit.append({
        actorUserId,
        entity: "order",
        entityId: orderId,
        action: "SHIP",
        before: beforeOrder,
        after: updatedOrder,
      });

      await this.orders.enqueueNotificationTx(tx, {
        template_key: "order_shipped",
        to_address: order.ship_phone ?? "",
        payload: { order_number: order.order_number, tracking_url: updatedShipment.tracking_url ?? null },
      });

      return { order: updatedOrder, shipment: updatedShipment };
    });
  }

  async markDelivered(orderId: string, actorUserId: string) {
    const order = await this.orders.getById(orderId);
    if (!order) throw new AppError("NOT_FOUND", 404, "Order not found");
    if (order.status !== "SHIPPED") throw new AppError("CONFLICT", 409, "Only SHIPPED orders can be delivered");

    return this.shipments.tx(async (tx) => {
      const beforeOrder = order;
      const shipment = await this.shipments.getByOrderIdTx(tx, orderId);
      if (!shipment) throw new AppError("CONFLICT", 409, "Shipment record missing");

      const updatedShipment = await this.shipments.setDeliveredTx(tx, shipment.id, new Date());
      const updatedOrder = await this.orders.updateStatusTx(tx, orderId, "DELIVERED");

      const audit = new AuditService(tx as any);
      await audit.append({
        actorUserId,
        entity: "shipment",
        entityId: shipment.id,
        action: "DELIVER",
        before: shipment,
        after: updatedShipment,
      });
      await audit.append({
        actorUserId,
        entity: "order",
        entityId: orderId,
        action: "DELIVER",
        before: beforeOrder,
        after: updatedOrder,
      });

      await this.orders.enqueueNotificationTx(tx, {
        template_key: "order_delivered",
        to_address: order.ship_phone ?? "",
        payload: { order_number: order.order_number },
      });

      return { order: updatedOrder, shipment: updatedShipment };
    });
  }
}
