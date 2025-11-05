import { PgClientLike, withTx } from "./_tx";

type ListArgs = {
  status?: string | string[];
  from?: string;
  to?: string;
  q?: string;
  page: number;
  limit: number;
  sort?: string;
};

export class PaymentsRepo {
  constructor(private readonly db: PgClientLike) {}

  async list(args: ListArgs) {
    const where: string[] = [];
    const params: any[] = [];

    if (args.status) {
      const arr = Array.isArray(args.status) ? args.status : [args.status];
      params.push(arr);
      where.push(`p.status = ANY($${params.length})`);
    } else {
      where.push(`p.status = 'SUBMITTED'`); // default queue
    }

    if (args.from) {
      params.push(args.from);
      where.push(`p.created_at >= $${params.length}`);
    }
    if (args.to) {
      params.push(args.to);
      where.push(`p.created_at < $${params.length}`);
    }

    if (args.q) {
      params.push(`%${args.q}%`);
      const p = `$${params.length}`;
      where.push(`(o.order_number ILIKE ${p} OR o.ship_name ILIKE ${p} OR o.ship_phone ILIKE ${p} OR p.reference_text ILIKE ${p})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sortSql = args.sort === "-created_at" ? "ORDER BY p.created_at DESC" : "ORDER BY p.created_at ASC";

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      ${whereSql}
    `;
    const total = (await this.db.query(countSql, params)).rows[0]?.total ?? 0;

    const offset = (args.page - 1) * args.limit;
    params.push(args.limit, offset);

    const listSql = `
      SELECT
        p.*,
        jsonb_build_object(
          'id', o.id,
          'order_number', o.order_number,
          'status', o.status,
          'payment_status', o.payment_status,
          'ship_name', o.ship_name,
          'ship_phone', o.ship_phone
        ) AS order
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      ${whereSql}
      ${sortSql}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const items = (await this.db.query(listSql, params)).rows;
    return { items, page: args.page, pageSize: args.limit, total };
  }

  async getByOrderId(orderId: string) {
    const sql = `SELECT * FROM payments WHERE order_id = $1`;
    const rows = (await this.db.query(sql, [orderId])).rows;
    return rows[0] ?? null;
  }

  async updateStatusTx(
    tx: PgClientLike,
    paymentId: string,
    status: "CONFIRMED" | "REJECTED",
    extras: { verified_at?: Date; verified_by?: string | null; rejection_reason?: string; reference_text?: string | null }
  ) {
    const fields: string[] = [`status = $2`, `updated_at = NOW()`];
    const params: any[] = [paymentId, status];

    if (extras.verified_at) {
      params.push(extras.verified_at);
      fields.push(`verified_at = $${params.length}`);
    }
    if (extras.verified_by !== undefined) {
      params.push(extras.verified_by);
      fields.push(`verified_by = $${params.length}`);
    }
    if (extras.rejection_reason !== undefined) {
      params.push(extras.rejection_reason);
      fields.push(`rejection_reason = $${params.length}`);
    }
    if (extras.reference_text !== undefined) {
      params.push(extras.reference_text);
      fields.push(`reference_text = $${params.length}`);
    }

    const sql = `UPDATE payments SET ${fields.join(", ")} WHERE id = $1 RETURNING *`;
    return (await tx.query(sql, params)).rows[0];
  }

  async tx<T>(fn: (tx: PgClientLike) => Promise<T>) {
    return withTx(fn);
  }
}
