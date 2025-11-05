import { getDb } from "../modules/db";
import { toSlug } from "../utils/slug";

export type ProductRow = {
  id: string;
  title: string;
  slug: string;
  category: "RUDRAKSHA" | "GEMSTONE" | "ACCESSORY";
  price_paise: number;
  description: string | null;
  authenticity_note: string | null;
  active: boolean;
  stock_qty: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const ProductRepo = {
  async create(
    input: Omit<ProductRow, "created_at" | "updated_at" | "deleted_at" | "slug">
  ): Promise<ProductRow> {
    const db = getDb();
    const slug = toSlug(input.title);
    const q = await db.query<ProductRow>(
      `INSERT INTO products (id, title, slug, category, price_paise, description, authenticity_note, active, stock_qty, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       RETURNING *`,
      [
        input.id,
        input.title,
        slug,
        input.category,
        input.price_paise,
        input.description ?? null,
        input.authenticity_note ?? null,
        input.active,
        input.stock_qty ?? null,
      ]
    );
    return q.rows[0];
  },

  async ensureUniqueSlug(base: string, exceptId?: string): Promise<string> {
    const db = getDb();
    let slug = toSlug(base) || "item";
    let i = 0;
    while (true) {
      const candidate = i ? `${slug}-${i}` : slug;
      const q = await db.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count
         FROM products
         WHERE slug=$1 AND deleted_at IS NULL ${exceptId ? "AND id<>$2" : ""}`,
        exceptId ? [candidate, exceptId] : [candidate]
      );
      if (Number(q.rows[0].count) === 0) return candidate;
      i++;
    }
  },

  async update(id: string, patch: Partial<ProductRow>): Promise<ProductRow | null> {
    const db = getDb();
    let slugSql = "";
    const params: any[] = [];
    let idx = 1;

    if (patch.title) {
      const newSlug = await this.ensureUniqueSlug(patch.title, id);
      slugSql = `, slug = $${idx++}`;
      params.push(newSlug);
    }

    const q = await db.query<ProductRow>(
      `UPDATE products
         SET title=COALESCE($${idx++}, title),
             category=COALESCE($${idx++}, category),
             price_paise=COALESCE($${idx++}, price_paise),
             description=COALESCE($${idx++}, description),
             authenticity_note=COALESCE($${idx++}, authenticity_note),
             active=COALESCE($${idx++}, active),
             stock_qty=COALESCE($${idx++}, stock_qty),
             updated_at=NOW()
             ${slugSql}
       WHERE id=$${idx++} AND deleted_at IS NULL
       RETURNING *`,
      [
        patch.title ?? null,
        patch.category ?? null,
        patch.price_paise ?? null,
        patch.description ?? null,
        patch.authenticity_note ?? null,
        patch.active ?? null,
        patch.stock_qty ?? null,
        ...params,
        id,
      ]
    );
    return q.rows[0] ?? null;
  },

  async findById(id: string): Promise<ProductRow | null> {
    const db = getDb();
    const q = await db.query<ProductRow>(
      `SELECT * FROM products WHERE id=$1 AND deleted_at IS NULL`,
      [id]
    );
    return q.rows[0] ?? null;
  },

  async softDelete(id: string): Promise<void> {
    const db = getDb();
    await db.query(
      `UPDATE products
       SET deleted_at = NOW(), active = FALSE
       WHERE id=$1 AND deleted_at IS NULL`,
      [id]
    );
  },

  async page(params: {
    q?: string;
    category?: ProductRow["category"];
    active?: boolean;
    min_price_paise?: number;
    max_price_paise?: number;
    in_stock?: boolean;
    has_images?: boolean;
    created_from?: string;
    created_to?: string;
    include?: "none" | "primary" | "images";
    images_limit?: number;
    page: number;
    pageSize: number;
    sort: string;
  }) {
    const db = getDb();
    const where: string[] = [`p.deleted_at IS NULL`];
    const values: any[] = [];
    let i = 1;

    if (params.category) {
      where.push(`p.category=$${i++}`);
      values.push(params.category);
    }
    if (typeof params.active === "boolean") {
      where.push(`p.active=$${i++}`);
      values.push(params.active);
    }
    if (params.q) {
      where.push(`p.title ILIKE $${i++}`);
      values.push(`%${params.q}%`);
    }
    if (typeof params.min_price_paise === "number") {
      where.push(`p.price_paise >= $${i++}`);
      values.push(params.min_price_paise);
    }
    if (typeof params.max_price_paise === "number") {
      where.push(`p.price_paise <= $${i++}`);
      values.push(params.max_price_paise);
    }
    if (params.in_stock) {
      where.push(`COALESCE(p.stock_qty,0) > 0`);
    }
    if (params.has_images) {
      where.push(`EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)`);
    }
    if (params.created_from) {
      where.push(`p.created_at >= $${i++}`);
      values.push(params.created_from);
    }
    if (params.created_to) {
      where.push(`p.created_at <= $${i++}`);
      values.push(params.created_to);
    }

    const sortMap: Record<string, string> = {
      created_at: "p.created_at ASC",
      "-created_at": "p.created_at DESC",
      price_paise: "p.price_paise ASC",
      "-price_paise": "p.price_paise DESC",
      title: "p.title ASC",
      "-title": "p.title DESC",
    };
    const orderBy = sortMap[params.sort] ?? "p.created_at DESC";
    const offset = (params.page - 1) * params.pageSize;

    const include = params.include ?? "none";
    const cols: string[] = ["p.*"];
    if (include === "primary") {
      cols.push(`(
        SELECT pi.url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.position ASC, pi.id ASC
        LIMIT 1
      ) AS primary_image_url`);
    } else if (include === "images") {
      const limIdx = i++;
      values.push(params.images_limit ?? 5);
      cols.push(`COALESCE((
        SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'position', pi.position)
                        ORDER BY pi.position ASC, pi.id ASC)
        FROM (
          SELECT id, url, position
          FROM product_images
          WHERE product_id = p.id
          ORDER BY position ASC, id ASC
          LIMIT $${limIdx}
        ) pi
      ), '[]'::json) AS images`);
    }

    const list = await db.query<any>(
      `SELECT ${cols.join(", ")}
       FROM products p
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderBy}
       LIMIT $${i++} OFFSET $${i++}`,
      [...values, params.pageSize, offset]
    );

    const count = await db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count
       FROM products p
       WHERE ${where.join(" AND ")}`,
      values
    );

    return { items: list.rows, total: Number(count.rows[0].count) };
  },

  async findActiveBySlug(slug: string): Promise<ProductRow | null> {
    const db = getDb();
    const q = await db.query<ProductRow>(
      `SELECT * FROM products
       WHERE slug=$1 AND active=TRUE AND deleted_at IS NULL`,
      [slug]
    );
    return q.rows[0] ?? null;
  },
};
