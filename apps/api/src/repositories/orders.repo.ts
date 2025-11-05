import { PgClientLike, withTx } from "./_tx";

type ListArgs = {
  status?: string | string[];
  payment_status?: string | string[];
  from?: string;
  to?: string;
  q?: string;
  page: number;
  limit: number;
  sort?: string;
};

export class OrdersRepo {
  constructor(private readonly db: PgClientLike) {}

  async list(args: ListArgs) {
    const where: string[] = [];
    const params: any[] = [];

    if (args.status) {
      const arr = Array.isArray(args.status) ? args.status : [args.status];
      params.push(arr);
      where.push(`o.status = ANY($${params.length})`);
    }

    if (args.payment_status) {
      const arr = Array.isArray(args.payment_status) ? args.payment_status : [args.payment_status];
      params.push(arr);
      where.push(`o.payment_status = ANY($${params.length})`);
    }

    if (args.from) {
      params.push(args.from);
      where.push(`o.created_at >= $${params.length}`);
    }
    if (args.to) {
      params.push(args.to);
      where.push(`o.created_at < $${params.length}`);
    }

    if (args.q) {
      params.push(`%${args.q}%`);
      const p = `$${params.length}`;
      where.push(
        `(o.order_number ILIKE ${p} OR o.ship_name ILIKE ${p} OR o.ship_phone ILIKE ${p} OR p.reference_text ILIKE ${p})`
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sortSql =
      args.sort === "order_number" ? "ORDER BY o.order_number ASC"
      : args.sort === "-created_at" ? "ORDER BY o.created_at DESC"
      : "ORDER BY o.created_at ASC";

    // count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      ${whereSql}
    `;
    const total = (await this.db.query(countSql, params)).rows[0]?.total ?? 0;

    // page
    const offset = (args.page - 1) * args.limit;
    params.push(args.limit, offset);

    const listSql = `
      SELECT
        o.*,
        jsonb_build_object(
          'status', p.status,
          'submitted_at', p.submitted_at,
          'verified_at', p.verified_at
        ) AS payment,
        jsonb_build_object(
          'courier_name', s.courier_name,
          'awb_number', s.awb_number,
          'tracking_url', s.tracking_url
        ) AS shipment
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN shipments s ON s.order_id = o.id
      ${whereSql}
      ${sortSql}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const items = (await this.db.query(listSql, params)).rows;

    return { items, page: args.page, pageSize: args.limit, total };
  }

  async getById(orderId: string) {
    const sql = `SELECT * FROM orders WHERE id = $1`;
    const rows = (await this.db.query(sql, [orderId])).rows;
    return rows[0] ?? null;
  }

  async listItems(orderId: string) {
    const sql = `
      SELECT product_id, variant_id, title_snapshot AS title, variant_snapshot AS variant,
             unit_price_paise, qty, line_total_paise
      FROM order_items WHERE order_id = $1
      ORDER BY id
    `;
    return (await this.db.query(sql, [orderId])).rows;
  }

  async updateStatus(orderId: string, status: string) {
    const sql = `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`;
    return (await this.db.query(sql, [orderId, status])).rows[0];
  }

  async updateStatusTx(tx: PgClientLike, orderId: string, status: string) {
    const sql = `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`;
    return (await tx.query(sql, [orderId, status])).rows[0];
  }

  async updateStatusesTx(tx: PgClientLike, orderId: string, fields: { payment_status?: string; status?: string }) {
    const parts: string[] = [];
    const params: any[] = [orderId];

    if (fields.payment_status) {
      params.push(fields.payment_status);
      parts.push(`payment_status = $${params.length}`);
    }
    if (fields.status) {
      params.push(fields.status);
      parts.push(`status = $${params.length}`);
    }
    parts.push(`updated_at = NOW()`);

    const sql = `UPDATE orders SET ${parts.join(", ")} WHERE id = $1 RETURNING *`;
    return (await tx.query(sql, params)).rows[0];
  }

  async enqueueNotification(payload: { template_key: string; to_address: string; payload: any }) {
    const sql = `
      INSERT INTO notifications_outbox (id, channel, to_address, template_key, payload, status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'SMS', $1, $2, $3::json, 'PENDING', NOW(), NOW())
    `;
    await this.db.query(sql, [payload.to_address, payload.template_key, JSON.stringify(payload.payload)]);
  }

  async enqueueNotificationTx(tx: PgClientLike, payload: { template_key: string; to_address: string; payload: any }) {
    const sql = `
      INSERT INTO notifications_outbox (id, channel, to_address, template_key, payload, status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'SMS', $1, $2, $3::json, 'PENDING', NOW(), NOW())
    `;
    await tx.query(sql, [payload.to_address, payload.template_key, JSON.stringify(payload.payload)]);
  }

  async tx<T>(fn: (tx: PgClientLike) => Promise<T>) {
    return withTx(fn);
  }
}
