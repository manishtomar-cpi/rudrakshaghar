import type { Client } from "pg";

export class DashboardRepo {
  constructor(private db: Client) {}

  async countPaymentsSubmitted(): Promise<number> {
    const q = await this.db.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM payments WHERE status = 'SUBMITTED';`
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
    return new Map(q.rows.map((r) => [r.status, Number(r.cnt)]));
  }

  /**
   * Sum of revenue for CONFIRMED payments within window, using the order's total amount.
   * Schema source of truth:
   *   - payments.status='CONFIRMED'
   *   - payments.verified_at = confirmation time
   *   - orders.total_payable_paise = amount
   */
  async sumConfirmedPaymentsInWindow(fromIso: string, toIso: string): Promise<number> {
    const q = await this.db.query<{ sum: string | null }>(
      `
      SELECT COALESCE(SUM(o.total_payable_paise), 0)::text AS sum
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.status = 'CONFIRMED'
        AND p.verified_at >= $1 AND p.verified_at < $2;
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

  /**
   * Latest SUBMITTED payments with order amount and customer info.
   * customers -> users via orders.user_id
   */
  async listSubmittedPayments(limit: number) {
    const q = await this.db.query<{
      order_id: string;
      order_number: string; 
      amount: number;
      submitted_at: string | null;
      customer_name: string | null;
      customer_phone: string | null;
    }>(
      `
      SELECT
        p.order_id,
         o.order_number,
        o.total_payable_paise AS amount,
        p.submitted_at,
        u.name  AS customer_name,
        u.phone AS customer_phone
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN users u ON u.id = o.user_id
      WHERE p.status = 'SUBMITTED'
      ORDER BY p.submitted_at DESC NULLS LAST
      LIMIT $1;
      `,
      [limit]
    );

    return q.rows.map((r) => ({
      orderId: r.order_id,
      orderNumber: r.order_number, 
      amount: r.amount ?? 0,
      submittedAt: r.submitted_at ?? new Date().toISOString(),
      customer:
        r.customer_name || r.customer_phone
          ? { name: r.customer_name, phone: r.customer_phone }
          : null,
    }));
  }

  /**
   * Orders needing shipment = status in (PAYMENT_CONFIRMED, PACKED) and no shipped_at
   */
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
    return q.rows.map((r) => ({ orderId: r.id, status: r.status, placedAt: r.created_at }));
  }

  /**
   * Revenue daily buckets by payment confirmation time, sum order totals.
   */
  async revenueDaily(fromIso: string, toIso: string, tz?: string) {
    const tzExpr = tz ? `timezone($3, p.verified_at)` : `p.verified_at`;
    const params = tz ? [fromIso, toIso, tz] : [fromIso, toIso];
    const q = await this.db.query<{ d: string; revenue: string | null }>(
      `
      SELECT (date_trunc('day', ${tzExpr}))::date AS d,
             COALESCE(SUM(o.total_payable_paise), 0)::text AS revenue
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.status = 'CONFIRMED'
        AND p.verified_at >= $1 AND p.verified_at < $2
      GROUP BY d
      ORDER BY d;
      `,
      params as any[]
    );
    return q.rows.map((r) => ({ date: r.d, amount: Number(r.revenue ?? "0") }));
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
    return q.rows.map((r) => ({ date: r.d, count: Number(r.cnt) }));
  }

  /**
   * Top products by revenue and qty in the window.
   * Use order_items.unit_price_paise.
   */
  async topProducts(fromIso: string, toIso: string) {
    const q = await this.db.query<{
      product_id: string;
      title: string | null;
      qty: string;
      revenue: string | null;
    }>(
      `
      SELECT
        i.product_id,
        COALESCE(p.title, 'Unknown') AS title,
        SUM(i.qty)::text AS qty,
        COALESCE(SUM(i.qty * i.unit_price_paise), 0)::text AS revenue
      FROM order_items i
      JOIN orders o ON o.id = i.order_id
      LEFT JOIN products p ON p.id = i.product_id
      WHERE o.created_at >= $1 AND o.created_at < $2
      GROUP BY i.product_id, p.title
      ORDER BY (COALESCE(SUM(i.qty * i.unit_price_paise), 0)) DESC
      LIMIT 5;
      `,
      [fromIso, toIso]
    );

    return q.rows.map((r) => ({
      productId: r.product_id,
      title: r.title ?? "Unknown",
      qty: Number(r.qty),
      revenue: Number(r.revenue ?? "0"),
    }));
  }

  /**
   * Active products without a "primary" image (position = 0)
   */
  async countActiveProductsWithNoPrimaryImage(): Promise<number> {
    const q = await this.db.query<{ cnt: string }>(
      `
      SELECT COUNT(*)::text AS cnt
      FROM products p
      LEFT JOIN product_images pi
        ON pi.product_id = p.id AND pi.position = 0
      WHERE p.active = TRUE AND pi.id IS NULL;
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
    return q.rows.map((r) => ({
      productId: r.id,
      title: r.title,
      updatedAt: r.updated_at,
      active: !!r.active,
    }));
  }
}
