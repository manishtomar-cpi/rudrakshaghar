// apps/api/src/repositories/addresses.repo.ts
import { getDb } from "../modules/db";

export type AddressRow = {
  id: string;
  user_id: string;
  label: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export const AddressesRepo = {
  async list(userId: string): Promise<AddressRow[]> {
    const db = getDb();
    const q = await db.query<AddressRow>(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return q.rows;
  },

  async findById(id: string): Promise<AddressRow | null> {
    const db = getDb();
    const q = await db.query<AddressRow>(`SELECT * FROM addresses WHERE id = $1`, [id]);
    return q.rows[0] ?? null;
  },

  /** ✅ Ownership-checked fetch (used by checkout) */
  async findByIdForUser(id: string, userId: string): Promise<AddressRow | null> {
    const db = getDb();
    const q = await db.query<AddressRow>(
      `SELECT * FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return q.rows[0] ?? null;
  },

  async create(a: {
    id: string;
    user_id: string;
    label?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
    is_default: boolean;
  }): Promise<AddressRow> {
    const db = getDb();
    const q = await db.query<AddressRow>(
      `INSERT INTO addresses
        (id, user_id, label, line1, line2, city, state, pincode, country, is_default, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW(), NOW())
       RETURNING *`,
      [
        a.id, a.user_id, a.label ?? null, a.line1, a.line2 ?? null, a.city, a.state,
        a.pincode, a.country, a.is_default,
      ]
    );
    return q.rows[0];
  },

  async update(id: string, userId: string, a: {
    label?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    is_default?: boolean | null;
  }): Promise<AddressRow | null> {
    const db = getDb();
    const q = await db.query<AddressRow>(
      `UPDATE addresses
         SET label = COALESCE($3, label),
             line1 = COALESCE($4, line1),
             line2 = COALESCE($5, line2),
             city = COALESCE($6, city),
             state = COALESCE($7, state),
             pincode = COALESCE($8, pincode),
             country = COALESCE($9, country),
             is_default = COALESCE($10, is_default),
             updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id, userId,
        a.label ?? null, a.line1 ?? null, a.line2 ?? null, a.city ?? null,
        a.state ?? null, a.pincode ?? null, a.country ?? null, a.is_default ?? null,
      ]
    );
    return q.rows[0] ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = getDb();
    const q = await db.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2`, [id, userId]);
    return (q.rowCount ?? 0) > 0;
  },

  async clearDefault(userId: string) {
    const db = getDb();
    await db.query(`UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE`, [userId]);
  },

  async setDefault(id: string, userId: string): Promise<AddressRow | null> {
    const db = getDb();
    const q = await db.query<AddressRow>(
      `UPDATE addresses SET is_default = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    return q.rows[0] ?? null;
  },
};
