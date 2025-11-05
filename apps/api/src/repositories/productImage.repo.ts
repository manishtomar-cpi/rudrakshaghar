import { getDb } from "../modules/db";

export type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  position: number;
};

export const ProductImageRepo = {
  async create(row: { id: string; product_id: string; url: string; position?: number }) {
    const db = getDb();
    const q = await db.query<ProductImageRow>(
      `INSERT INTO product_images (id, product_id, url, position)
       VALUES ($1,$2,$3,COALESCE($4,0))
       RETURNING *`,
      [row.id, row.product_id, row.url, row.position ?? 0]
    );
    return q.rows[0];
  },

  async list(productId: string): Promise<ProductImageRow[]> {
    const db = getDb();
    const q = await db.query<ProductImageRow>(
      `SELECT * FROM product_images WHERE product_id=$1 ORDER BY position ASC, id ASC`, [productId]
    );
    return q.rows;
  },

  async updateOrder(pairs: { id: string; position: number }[]): Promise<void> {
    const db = getDb();
    const queries = pairs.map((p, idx) =>
      db.query(`UPDATE product_images SET position=$1 WHERE id=$2`, [p.position, p.id])
    );
    await Promise.all(queries);
  },

  async findById(id: string): Promise<ProductImageRow|null> {
    const db = getDb();
    const q = await db.query<ProductImageRow>(`SELECT * FROM product_images WHERE id=$1`, [id]);
    return q.rows[0] ?? null;
  },

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.query(`DELETE FROM product_images WHERE id=$1`, [id]);
  }
};
