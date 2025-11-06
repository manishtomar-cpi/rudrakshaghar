// apps/api/src/repositories/customerOrders.repo.ts
import { getDb } from "../modules/db";

/** ---------- Types: DB row-like shapes used by the repo (narrow, explicit) ---------- */

export type OrderStatus =
  | "PLACED"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "NONE" | "SUBMITTED" | "CONFIRMED" | "REJECTED";

type CreateOrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;

  total_item_paise: number;
  shipping_paise: number;
  discount_paise: number;
  total_payable_paise: number;

  ship_name: string | null;
  ship_phone: string | null;
  ship_line1: string | null;
  ship_line2: string | null;
  ship_city: string | null;
  ship_state: string | null;
  ship_pincode: string | null;
  ship_country: string | null;

  payment_method: string; // 'UPI_MANUAL' (MVP)
  payment_status: PaymentStatus;
};

type CreatePaymentRow = {
  upi_vpa: string;
  qr_payload: string;
  intent_url: string;
  status: PaymentStatus; // 'NONE' initially
};

type ItemSnapshotRow = {
  product_id: string;
  variant_id: string | null;
  title_snapshot: string;
  variant_snapshot: string | null;
  unit_price_paise: number;
  qty: number;
  line_total_paise: number;
};

type ShipmentSummary = {
  courier_name: string | null;
  awb_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;    // TIMESTAMP as ISO string from node-postgres
  delivered_at: string | null;  // "
};

type ListItem = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_payable_paise: number;
  created_at: string;
  shipment: ShipmentSummary | null;
};

/** Small helper to normalize a payment row subset */
function mapPaymentRow(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    upi_vpa: r.upi_vpa,
    qr_payload: r.qr_payload,
    intent_url: r.intent_url,
    submitted_at: r.submitted_at ?? null,
    screenshot_url: r.screenshot_url ?? null,
    reference_text: r.reference_text ?? null,
    status: r.status as PaymentStatus,
    verified_at: r.verified_at ?? null,
  };
}

export const CustomerOrdersRepo = {
  /**
   * Creates order, order_items, payment in a single transaction.
   * Optional idempotency key: if provided and a recent order with same key exists, return it. (MVP: not persisted)
   */
  async createFull(input: {
    order: CreateOrderRow;
    items: ItemSnapshotRow[];
    payment: CreatePaymentRow;
    idempotencyKey?: string;
  }) {
    const db = getDb();
    const client = db;

    await client.query("BEGIN");
    try {
      // orders
      const orderQ = await client.query(
        `INSERT INTO orders
           (id, order_number, user_id, status,
            total_item_paise, shipping_paise, discount_paise, total_payable_paise,
            ship_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, ship_country,
            payment_method, payment_status, created_at, updated_at)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, NOW(), NOW())
         RETURNING *`,
        [
          input.order.id,
          input.order.order_number,
          input.order.user_id,
          input.order.status,
          input.order.total_item_paise,
          input.order.shipping_paise,
          input.order.discount_paise,
          input.order.total_payable_paise,
          input.order.ship_name,
          input.order.ship_phone,
          input.order.ship_line1,
          input.order.ship_line2,
          input.order.ship_city,
          input.order.ship_state,
          input.order.ship_pincode,
          input.order.ship_country,
          input.order.payment_method,
          input.order.payment_status,
        ]
      );
      const order = orderQ.rows[0];

      // order_items (bulk insert)
      const itemsValues: any[] = [];
      const itemsSqlParts: string[] = [];
      let i = 1;
      for (const it of input.items) {
        itemsSqlParts.push(
          ` (gen_random_uuid(), $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}) `
        );
        itemsValues.push(
          order.id,
          it.product_id,
          it.variant_id,
          it.title_snapshot,
          it.variant_snapshot,
          it.unit_price_paise,
          it.qty,
          it.line_total_paise
        );
      }

      const itemsQ = await client.query(
        `INSERT INTO order_items
           (id, order_id, product_id, variant_id, title_snapshot, variant_snapshot, unit_price_paise, qty, line_total_paise)
         VALUES ${itemsSqlParts.join(",")}
         RETURNING *`,
        itemsValues
      );
      const items = itemsQ.rows;

      // payments (1:1 with orders)
      const payQ = await client.query(
        `INSERT INTO payments
           (id, order_id, upi_vpa, qr_payload, intent_url,
            status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [
          order.id,
          input.payment.upi_vpa,
          input.payment.qr_payload,
          input.payment.intent_url,
          input.payment.status,
        ]
      );
      const payment = payQ.rows[0];

      await client.query("COMMIT");
      return {
        order,
        items,
        payment: mapPaymentRow(payment),
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  },

  /** Phase-3: list my orders (header only) */
  async listForUser(input: { userId: string; page: number; pageSize: number }) {
    const db = getDb();
    const offset = (input.page - 1) * input.pageSize;

    const list = await db.query(
      `SELECT o.*
         FROM orders o
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3`,
      [input.userId, input.pageSize, offset]
    );

    const count = await db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count
         FROM orders o
        WHERE o.user_id = $1`,
      [input.userId]
    );

    return { items: list.rows, total: Number(count.rows[0].count) };
  },

  /** Phase-3: get one order (items + payment) */
  async getByIdForUser(orderId: string, userId: string) {
    const db = getDb();

    const orderQ = await db.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );
    const order = orderQ.rows[0];
    if (!order) return null;

    const itemsQ = await db.query(
      `SELECT *
         FROM order_items
        WHERE order_id = $1
        ORDER BY id ASC`,
      [orderId]
    );

    const paymentQ = await db.query(
      `SELECT id, upi_vpa, qr_payload, intent_url, status, screenshot_url, reference_text, submitted_at, verified_at, verified_by
         FROM payments
        WHERE order_id = $1
        LIMIT 1`,
      [orderId]
    );

    return {
      order,
      items: itemsQ.rows,
      payment: mapPaymentRow(paymentQ.rows[0]),
    };
  },

  /** Phase-4: list my orders with shipment summary */
  async listForUserWithShipment(params: {
    userId: string;
    status?: OrderStatus | string;
    page: number;
    pageSize: number;
  }): Promise<{ items: ListItem[]; total: number }> {
    const db = getDb();

    const where: string[] = ["o.user_id = $1"];
    const values: any[] = [params.userId];
    let i = 2;

    if (params.status) {
      where.push(`o.status = $${i++}`);
      values.push(params.status);
    }

    const offset = (params.page - 1) * params.pageSize;

    const listQ = await db.query<ListItem>(
      `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.total_payable_paise,
        o.created_at,
        CASE
          WHEN s.order_id IS NULL THEN NULL
          ELSE json_build_object(
            'courier_name', s.courier_name,
            'awb_number',   s.awb_number,
            'tracking_url', s.tracking_url,
            'shipped_at',   s.shipped_at,
            'delivered_at', s.delivered_at
          )
        END AS shipment
      FROM orders o
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE ${where.join(" AND ")}
      ORDER BY o.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
      `,
      [...values, params.pageSize, offset]
    );

    const countQ = await db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count
         FROM orders o
        WHERE ${where.join(" AND ")}`,
      values
    );

    return {
      items: listQ.rows,
      total: Number(countQ.rows[0].count),
    };
  },

  /** Phase-4: detail with shipment (order + items + payment + shipment) */
  async getByIdForUserWithShipment(orderId: string, userId: string) {
    const db = getDb();

    const o = await db.query<any>(
      `SELECT *
         FROM orders
        WHERE id=$1 AND user_id=$2
        LIMIT 1`,
      [orderId, userId]
    );
    const order = o.rows[0];
    if (!order) return null;

    const it = await db.query<any>(
      `SELECT *
         FROM order_items
        WHERE order_id=$1
        ORDER BY id ASC`,
      [orderId]
    );

    const p = await db.query<any>(
      `SELECT id, upi_vpa, qr_payload, intent_url, submitted_at, screenshot_url, reference_text, status, verified_at
         FROM payments
        WHERE order_id=$1
        LIMIT 1`,
      [orderId]
    );

    const s = await db.query<ShipmentSummary>(
      `SELECT courier_name, awb_number, tracking_url, shipped_at, delivered_at
         FROM shipments
        WHERE order_id=$1
        LIMIT 1`,
      [orderId]
    );

    return {
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status as OrderStatus,
        payment_status: order.payment_status as PaymentStatus,
        total_item_paise: order.total_item_paise,
        shipping_paise: order.shipping_paise,
        discount_paise: order.discount_paise,
        total_payable_paise: order.total_payable_paise,
        created_at: order.created_at,
      },
      items: it.rows,
      payment: mapPaymentRow(p.rows[0]),
      shipment: s.rows[0] ?? null,
    };
  },

  /** Phase-4: tiny shipment-only read (ownership enforced) */
  async getShipmentForOrder(orderId: string, userId: string): Promise<ShipmentSummary | null> {
    const db = getDb();

    const own = await db.query<{ id: string }>(
      `SELECT id FROM orders WHERE id=$1 AND user_id=$2 LIMIT 1`,
      [orderId, userId]
    );
    if (own.rowCount === 0) return null;

    const s = await db.query<ShipmentSummary>(
      `SELECT courier_name, awb_number, tracking_url, shipped_at, delivered_at
         FROM shipments
        WHERE order_id=$1
        LIMIT 1`,
      [orderId]
    );

    return s.rows[0] ?? null;
  },
};
