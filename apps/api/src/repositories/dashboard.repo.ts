import type { Client } from "pg";

export class DashboardRepo {
  constructor(private db: Client) {}

  async countPaymentsSubmitted(): Promise<number> {
    const q = await this.db.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM payments WHERE status='SUBMITTED';`
    );
    return Number(q.rows[0]?.cnt ?? 0);
  }

  async countOrdersByStatusInWindow(fromIso: string, toIso: string): Promise<Map<string, number>> {
    const q = await this.db.query<{ status: string; cnt: string }>(
      `
      SELECT status, COUNT(*)::text AS cnt
      FROM orders
      WHERE created_at >= $1 AND created_at < $2
      GROUP BY status;
      `,
      [fromIso, toIso]
    );
    return new Map(q.rows.map(r => [r.status, Number(r.cnt)]));
  }

  async sumConfirmedPaymentsInWindow(fromIso: string, toIso: string): Promise<number> {
    const q = await this.db.query<{ sum: string | null }>(
      `
      SELECT SUM(amount)::text AS sum
      FROM payments
      WHERE status='CONFIRMED'
        AND confirmed_at >= $1 AND confirmed_at < $2;
      `,
      [fromIso, toIso]
    );
    return Number(q.rows[0]?.sum ?? 0);
  }

  async countOrdersPlacedInWindow(fromIso: string, toIso: string): Promise<number> {
    const q = await this.db.query<{ cnt: string }>(
      `
      SELECT COUNT(*)::text AS cnt
      FROM orders
      WHERE created_at >= $1 AND created_at < $2;
      `,
      [fromIso, toIso]
    );
    return Number(q.rows[0]?.cnt ?? 0);
  }

  async productCounts(): Promise<{ active: number; inactive: number }> {
    const q = await this.db.query<{ active_products: string; inactive_products: string }>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN active THEN 1 ELSE 0 END),0)::text AS active_products,
        COALESCE(SUM(CASE WHEN NOT active THEN 1 ELSE 0 END),0)::text AS inactive_products
      FROM products;
      `
    );
    return {
      active: Number(q.rows[0]?.active_products ?? 0),
      inactive: Number(q.rows[0]?.inactive_products ?? 0),
    };
  }

  async listSubmittedPayments(limit: number) {
    const q = await this.db.query<{
      order_id: string;
      amount: number;
      submitted_at: string;
      customer_name: string | null;
      customer_phone: string | null;
    }>(
      `
      SELECT p.order_id,
             p.amount,
             p.submitted_at,
             c.name AS customer_name,
             c.phone AS customer_phone
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE p.status='SUBMITTED'
      ORDER BY p.submitted_at DESC
      LIMIT $1;
      `,
      [limit]
    );
    return q.rows.map(r => ({
      orderId: r.order_id,
      amount: r.amount,
      submittedAt: r.submitted_at,
      customer: r.customer_name || r.customer_phone ? { name: r.customer_name, phone: r.customer_phone } : null,
    }));
    }

  async listOrdersNeedingShipment(limit: number) {
    const q = await this.db.query<{ id: string; status: string; created_at: string }>(
      `
      SELECT o.id, o.status, o.created_at
      FROM orders o
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE o.status IN ('PAYMENT_CONFIRMED','PACKED')
        AND (s.id IS NULL OR s.shipped_at IS NULL)
      ORDER BY o.updated_at DESC
      LIMIT $1;
      `,
      [limit]
    );
    return q.rows.map(r => ({ orderId: r.id, status: r.status, placedAt: r.created_at }));
  }

  async revenueDaily(fromIso: string, toIso: string, tz?: string) {
    const tzExpr = tz ? `timezone($3, p.confirmed_at)` : `p.confirmed_at`;
    const params = tz ? [fromIso, toIso, tz] : [fromIso, toIso];
    const q = await this.db.query<{ d: string; revenue: number }>(
      `
      SELECT (date_trunc('day', ${tzExpr}))::date AS d,
             COALESCE(SUM(p.amount),0) AS revenue
      FROM payments p
      WHERE p.status='CONFIRMED'
        AND p.confirmed_at >= $1 AND p.confirmed_at < $2
      GROUP BY d
      ORDER BY d;
      `,
      params as any[]
    );
    return q.rows.map(r => ({ date: r.d, amount: r.revenue ?? 0 }));
  }

  async ordersDaily(fromIso: string, toIso: string, tz?: string) {
    const tzExpr = tz ? `timezone($3, o.created_at)` : `o.created_at`;
    const params = tz ? [fromIso, toIso, tz] : [fromIso, toIso];
    const q = await this.db.query<{ d: string; cnt: string }>(
      `
      SELECT (date_trunc('day', ${tzExpr}))::date AS d,
             COUNT(*)::text AS cnt
      FROM orders o
      WHERE o.created_at >= $1 AND o.created_at < $2
      GROUP BY d
      ORDER BY d;
      `,
      params as any[]
    );
    return q.rows.map(r => ({ date: r.d, count: Number(r.cnt) }));
  }

  async topProducts(fromIso: string, toIso: string) {
    const q = await this.db.query<{ product_id: string; title: string; qty: string; revenue: number }>(
      `
      SELECT i.product_id,
             COALESCE(p.title, 'Unknown') AS title,
             SUM(i.qty)::text AS qty,
             SUM(i.qty * i.unit_price) AS revenue
      FROM order_items i
      JOIN orders o ON o.id = i.order_id
      LEFT JOIN products p ON p.id = i.product_id
      WHERE o.created_at >= $1 AND o.created_at < $2
      GROUP BY i.product_id, p.title
      ORDER BY revenue DESC
      LIMIT 5;
      `,
      [fromIso, toIso]
    );
    return q.rows.map(r => ({
      productId: r.product_id,
      title: r.title,
      qty: Number(r.qty),
      revenue: r.revenue ?? 0,
    }));
  }

  async countActiveProductsWithNoPrimaryImage(): Promise<number> {
    const q = await this.db.query<{ cnt: string }>(
      `
      SELECT COUNT(*)::text AS cnt
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.active = true AND pi.id IS NULL;
      `
    );
    return Number(q.rows[0]?.cnt ?? 0);
  }

  async listRecentlyUpdatedProducts(limit: number) {
    const q = await this.db.query<{ id: string; title: string; updated_at: string; active: boolean }>(
      `
      SELECT id, title, updated_at, active
      FROM products
      ORDER BY updated_at DESC
      LIMIT $1;
      `,
      [limit]
    );
    return q.rows.map(r => ({
      productId: r.id,
      title: r.title,
      updatedAt: r.updated_at,
      active: !!r.active,
    }));
  }
}
