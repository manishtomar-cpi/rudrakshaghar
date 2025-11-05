import { getDb } from "../modules/db";

export type ProductVariantRow = {
  id: string;
  product_id: string;
  label: string;
  price_paise: number|null;
  sku: string|null;
  active: boolean;
};

export const ProductVariantRepo = {
  async create(row: { id: string; product_id: string; label: string; price_paise?: number; sku?: string; active?: boolean }) {
    const db = getDb();
    const q = await db.query<ProductVariantRow>(
      `INSERT INTO product_variants (id, product_id, label, price_paise, sku, active)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,TRUE))
       RETURNING *`,
      [row.id, row.product_id, row.label, row.price_paise ?? null, row.sku ?? null, row.active ?? true]
    );
    return q.rows[0];
  },

  async update(id: string, patch: Partial<ProductVariantRow>): Promise<ProductVariantRow|null> {
    const db = getDb();
    const q = await db.query<ProductVariantRow>(
      `UPDATE product_variants
       SET label=COALESCE($2,label),
           price_paise=$3,
           sku=COALESCE($4,sku),
           active=COALESCE($5,active)
       WHERE id=$1
       RETURNING *`,
      [id, patch.label ?? null, patch.price_paise ?? null, patch.sku ?? null, patch.active ?? null]
    );
    return q.rows[0] ?? null;
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.query(`DELETE FROM product_variants WHERE id=$1`, [id]);
  },

  async list(productId: string): Promise<ProductVariantRow[]> {
    const db = getDb();
    const q = await db.query<ProductVariantRow>(
      `SELECT * FROM product_variants WHERE product_id=$1 ORDER BY label ASC`, [productId]
    );
    return q.rows;
  },
};
