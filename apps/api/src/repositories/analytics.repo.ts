import type { PgClientLike } from "./_tx";

export class AnalyticsRepo {
  constructor(private readonly db: PgClientLike) {}

  /**
   * Revenue = sum of o.total_payable_paise for orders with CONFIRMED payment
   * Window is by payments.verified_at
   * Optional filters: productId / category (narrow by items / product table)
   */
  async revenueSummary(args: {
    fromIso: string; toIso: string;
    productId?: string; category?: string;
  }): Promise<{ revenueP: number; orders: number; aovP: number }> {
    const filters: string[] = [`p.status='CONFIRMED'`, `p.verified_at >= $1`, `p.verified_at < $2`];
    const params: any[] = [args.fromIso, args.toIso];

    let joinItems = "";
    if (args.productId || args.category) {
      joinItems = `
        JOIN order_items oi ON oi.order_id = o.id
        ${args.category ? "JOIN products pr ON pr.id = oi.product_id" : ""}
      `;
      if (args.productId) {
        params.push(args.productId);
        filters.push(`oi.product_id = $${params.length}`);
      }
      if (args.category) {
        params.push(args.category);
        filters.push(`pr.category = $${params.length}`);
      }
    }

    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const sql = `
      SELECT
        COALESCE(SUM(o.total_payable_paise),0)::bigint AS revenue_p,
        COUNT(DISTINCT o.id)::bigint AS orders
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      ${joinItems}
      ${whereSql}
    `;
    const row = (await this.db.query(sql, params)).rows[0] ?? { revenue_p: 0, orders: 0 };
    const revenueP = Number(row.revenue_p || 0);
    const orders = Number(row.orders || 0);
    const aovP = orders ? Math.round(revenueP / orders) : 0;
    return { revenueP, orders, aovP };
  }

  async revenueTrend(args: {
    fromIso: string; toIso: string; groupBy: "day"|"week"|"month";
    tz?: string; productId?: string; category?: string;
  }): Promise<Array<{ bucket: string; revenueP: number }>> {
    const params: any[] = [args.fromIso, args.toIso];
    const filters: string[] = [`p.status='CONFIRMED'`, `p.verified_at >= $1`, `p.verified_at < $2`];

    let joinItems = "";
    if (args.productId || args.category) {
      joinItems = `
        JOIN order_items oi ON oi.order_id = o.id
        ${args.category ? "JOIN products pr ON pr.id = oi.product_id" : ""}
      `;
      if (args.productId) {
        params.push(args.productId);
        filters.push(`oi.product_id = $${params.length}`);
      }
      if (args.category) {
        params.push(args.category);
        filters.push(`pr.category = $${params.length}`);
      }
    }

    const tzExpr = args.tz ? `timezone($${params.push(args.tz)}, p.verified_at)` : `p.verified_at`;
    const part = args.groupBy === "month" ? "month" : args.groupBy === "week" ? "week" : "day";
    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const sql = `
      SELECT (date_trunc('${part}', ${tzExpr}))::date AS bucket,
             COALESCE(SUM(o.total_payable_paise),0)::bigint AS revenue_p
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      ${joinItems}
      ${whereSql}
      GROUP BY bucket
      ORDER BY bucket
    `;
    const rows = (await this.db.query(sql, params)).rows;
    return rows.map(r => ({ bucket: r.bucket, revenueP: Number(r.revenue_p || 0) }));
  }

  async topProducts(args: {
    fromIso: string; toIso: string; limit: number;
    category?: string;
  }): Promise<Array<{ productId: string; title: string; qty: number; revenueP: number }>> {
    const params: any[] = [args.fromIso, args.toIso, args.limit];
    const filters: string[] = [`p.status='CONFIRMED'`, `p.verified_at >= $1`, `p.verified_at < $2`];
    if (args.category) {
      params.push(args.category);
      filters.push(`pr.category = $${params.length}`);
    }
    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const sql = `
      SELECT
        oi.product_id,
        COALESCE(pr.title, 'Unknown') AS title,
        SUM(oi.qty)::bigint AS qty,
        SUM(oi.qty * oi.unit_price_paise)::bigint AS revenue_p
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products pr ON pr.id = oi.product_id
      ${args.category ? "JOIN products pr2 ON pr2.id = oi.product_id" : ""}
      ${whereSql}
      GROUP BY oi.product_id, pr.title
      ORDER BY revenue_p DESC
      LIMIT $3
    `;
    const rows = (await this.db.query(sql, params)).rows;
    return rows.map(r => ({
      productId: r.product_id,
      title: r.title,
      qty: Number(r.qty || 0),
      revenueP: Number(r.revenue_p || 0),
    }));
  }

  async revenueOrders(args: {
    fromIso: string; toIso: string; page: number; limit: number;
    status?: string; needsShipment?: boolean; sort?: string;
    productId?: string; category?: string;
  }) {
    const params: any[] = [args.fromIso, args.toIso];
    const filters: string[] = [`p.status='CONFIRMED'`, `p.verified_at >= $1`, `p.verified_at < $2`];

    let joinItems = "";
    if (args.productId || args.category) {
      joinItems = `
        JOIN order_items oi ON oi.order_id = o.id
        ${args.category ? "JOIN products pr ON pr.id = oi.product_id" : ""}
      `;
      if (args.productId) {
        params.push(args.productId);
        filters.push(`oi.product_id = $${params.length}`);
      }
      if (args.category) {
        params.push(args.category);
        filters.push(`pr.category = $${params.length}`);
      }
    }

    if (args.status) {
      params.push(args.status);
      filters.push(`o.status = $${params.length}`);
    }
    if (args.needsShipment) {
      filters.push(`o.status IN ('PAYMENT_CONFIRMED','PACKED')`);
      filters.push(`(s.id IS NULL OR s.shipped_at IS NULL)`);
    }

    const whereSql = `WHERE ${filters.join(" AND ")}`;
    const sortSql =
      args.sort === "order_number" ? "ORDER BY o.order_number ASC"
      : args.sort === "-created_at" ? "ORDER BY o.created_at DESC"
      : "ORDER BY o.created_at ASC";

    // count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN shipments s ON s.order_id = o.id
      ${joinItems}
      ${whereSql}
    `;
    const total = (await this.db.query(countSql, params)).rows[0]?.total ?? 0;

    const offset = (args.page - 1) * args.limit;
    params.push(args.limit, offset);

    const listSql = `
      SELECT
        o.id, o.order_number, o.status, o.created_at,
        o.total_payable_paise,
        jsonb_build_object('status', p.status, 'verified_at', p.verified_at) AS payment,
        jsonb_build_object('courier_name', s.courier_name, 'awb_number', s.awb_number, 'tracking_url', s.tracking_url) AS shipment
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN shipments s ON s.order_id = o.id
      ${joinItems}
      ${whereSql}
      ${sortSql}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const items = (await this.db.query(listSql, params)).rows;

    return { items, page: args.page, pageSize: args.limit, total };
  }
}
