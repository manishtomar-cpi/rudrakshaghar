import { PgClientLike, withTx } from "./_tx";

export class ShipmentsRepo {
  constructor(private readonly db: PgClientLike) {}

  async getByOrderId(orderId: string) {
    const sql = `SELECT * FROM shipments WHERE order_id = $1`;
    const rows = (await this.db.query(sql, [orderId])).rows;
    return rows[0] ?? null;
  }

  async getByOrderIdTx(tx: PgClientLike, orderId: string) {
    const sql = `SELECT * FROM shipments WHERE order_id = $1`;
    const rows = (await tx.query(sql, [orderId])).rows;
    return rows[0] ?? null;
  }

  async upsertTx(
    tx: PgClientLike,
    orderId: string,
    input: { courier_name: string; awb_number: string; tracking_url: string | null; shipped_at: Date }
  ) {
    const existing = await this.getByOrderIdTx(tx, orderId);
    if (existing) {
      const sql = `
        UPDATE shipments
        SET courier_name = $2, awb_number = $3, tracking_url = $4, shipped_at = $5, updated_at = NOW()
        WHERE order_id = $1
        RETURNING *
      `;
      const rows = (await tx.query(sql, [orderId, input.courier_name, input.awb_number, input.tracking_url, input.shipped_at])).rows;
      return rows[0];
    } else {
      const sql = `
        INSERT INTO shipments (id, order_id, courier_name, awb_number, tracking_url, shipped_at, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;
      const rows = (await tx.query(sql, [orderId, input.courier_name, input.awb_number, input.tracking_url, input.shipped_at])).rows;
      return rows[0];
    }
  }

  async setDeliveredTx(tx: PgClientLike, shipmentId: string, deliveredAt: Date) {
    const sql = `UPDATE shipments SET delivered_at = $2, updated_at = NOW() WHERE id = $1 RETURNING *`;
    return (await tx.query(sql, [shipmentId, deliveredAt])).rows[0];
  }

  async tx<T>(fn: (tx: PgClientLike) => Promise<T>) {
    return withTx(fn);
  }
}
