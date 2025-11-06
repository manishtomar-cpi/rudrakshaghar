// apps/api/src/repositories/customerPayments.repo.ts
import { getDb } from "../modules/db";

export const CustomerPaymentsRepo = {
  async submitProof(input: {
    orderId: string;
    screenshotUrl: string;
    referenceText: string | null;
  }) {
    const db = getDb();
    // Update payment and order atomically
    await db.query("BEGIN");
    try {
      const payQ = await db.query(
        `UPDATE payments
           SET status = 'SUBMITTED',
               screenshot_url = $2,
               reference_text = $3,
               submitted_at = NOW(),
               updated_at = NOW()
         WHERE order_id = $1
         RETURNING *`,
        [input.orderId, input.screenshotUrl, input.referenceText]
      );
      const payment = payQ.rows[0];

      const ordQ = await db.query(
        `UPDATE orders
           SET status = 'PAYMENT_SUBMITTED',
               payment_status = 'SUBMITTED',
               updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [input.orderId]
      );
      const order = ordQ.rows[0];

      await db.query("COMMIT");
      return { payment, order };
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    }
  },
};
