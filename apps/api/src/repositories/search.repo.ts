// apps/api/src/repositories/search.repo.ts
import { getDb } from "../modules/db";

type Category = "RUDRAKSHA" | "GEMSTONE" | "ACCESSORY";

type PageParams = {
  q?: string;
  category?: Category[];
  min_price_paise?: number;
  max_price_paise?: number;
  in_stock?: boolean;
  has_images?: boolean;
  include?: "none" | "primary" | "images";
  images_limit?: number;
  page: number;
  pageSize: number;
  sort: "created_at" | "-created_at" | "price_paise" | "-price_paise" | "title" | "-title";
};

type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  category: Category;
  price_paise: number;
  stock_qty: number | null;
  created_at: string;
  updated_at: string;
  primary_image_url?: string | null;
  images?: Array<{ id: string; url: string; position: number }>;
};

export const SearchRepo = {
  async page(params: PageParams): Promise<{ items: ProductListItem[]; total: number }> {
    const db = getDb();
    const where: string[] = ["p.deleted_at IS NULL", "p.active = TRUE"];
    const values: any[] = [];
    let i = 1;

    if (params.q) {
      where.push(`p.title ILIKE $${i++}`);
      values.push(`%${params.q}%`);
    }
    if (params.category && params.category.length > 0) {
      where.push(`p.category = ANY($${i++})`);
      values.push(params.category);
    }
    if (typeof params.min_price_paise === "number") {
      where.push(`p.price_paise >= $${i++}`);
      values.push(params.min_price_paise);
    }
    if (typeof params.max_price_paise === "number") {
      where.push(`p.price_paise <= $${i++}`);
      values.push(params.max_price_paise);
    }
    if (params.in_stock === true) {
      where.push(`COALESCE(p.stock_qty, 0) > 0`);
    }
    if (params.has_images === true) {
      where.push(`EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)`);
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

    const cols: string[] = [
      "p.id", "p.title", "p.slug", "p.category", "p.price_paise", "p.stock_qty", "p.created_at", "p.updated_at",
    ];

    if (params.include === "primary" || !params.include || params.include === "none") {
      // Include primary image when "primary" (default) — omit for "none"
      if ((params.include ?? "primary") === "primary") {
        cols.push(`(
          SELECT pi.url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.position ASC, pi.id ASC
          LIMIT 1
        ) AS primary_image_url`);
      }
    } else if (params.include === "images") {
      const limitIdx = i++;
      values.push(params.images_limit ?? 5);
      cols.push(`COALESCE((
        SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'position', pi.position)
                        ORDER BY pi.position ASC, pi.id ASC)
        FROM (
          SELECT id, url, position
          FROM product_images
          WHERE product_id = p.id
          ORDER BY position ASC, id ASC
          LIMIT $${limitIdx}
        ) pi
      ), '[]'::json) AS images`);
    }

    const list = await db.query<ProductListItem>(
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

  async facets(params: Omit<PageParams, "include" | "images_limit" | "page" | "pageSize" | "sort">) {
    const db = getDb();
    const where: string[] = ["p.deleted_at IS NULL", "p.active = TRUE"];
    const values: any[] = [];
    let i = 1;

    if (params.q) {
      where.push(`p.title ILIKE $${i++}`);
      values.push(`%${params.q}%`);
    }
    if (params.category && params.category.length > 0) {
      // Facets reflect current filters (including category if user selected)
      where.push(`p.category = ANY($${i++})`);
      values.push(params.category);
    }
    if (typeof params.min_price_paise === "number") {
      where.push(`p.price_paise >= $${i++}`);
      values.push(params.min_price_paise);
    }
    if (typeof params.max_price_paise === "number") {
      where.push(`p.price_paise <= $${i++}`);
      values.push(params.max_price_paise);
    }
    if (params.in_stock === true) {
      where.push(`COALESCE(p.stock_qty, 0) > 0`);
    }
    if (params.has_images === true) {
      where.push(`EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)`);
    }

    // Categories facet
    const catFacet = await db.query<{ key: Category; count: number }>(
      `SELECT p.category AS key, COUNT(*)::int AS count
       FROM products p
       WHERE ${where.join(" AND ")}
       GROUP BY p.category
       ORDER BY p.category ASC`,
      values
    );

    // Price buckets facet (₹ in paise)
    // Buckets: [0-49,900], [50,000-99,900], [100,000-199,900], [200,000+]
    const priceFacet = await db.query<{ bucket: string; count: number }>(
      `SELECT bucket, COUNT(*)::int AS count
       FROM (
         SELECT CASE
           WHEN p.price_paise < 50000 THEN '0-49900'
           WHEN p.price_paise BETWEEN 50000 AND 99900 THEN '50000-99900'
           WHEN p.price_paise BETWEEN 100000 AND 199900 THEN '100000-199900'
           ELSE '200000+'
         END AS bucket
         FROM products p
         WHERE ${where.join(" AND ")}
       ) t
       GROUP BY bucket
       ORDER BY
         CASE bucket
           WHEN '0-49900' THEN 1
           WHEN '50000-99900' THEN 2
           WHEN '100000-199900' THEN 3
           ELSE 4
         END`,
      values
    );

    return {
      categories: catFacet.rows.map(r => ({ key: r.key, count: r.count })),
      price_buckets: priceFacet.rows.map(r => {
        switch (r.bucket) {
          case "0-49900": return { min: 0, max: 49900, count: r.count };
          case "50000-99900": return { min: 50000, max: 99900, count: r.count };
          case "100000-199900": return { min: 100000, max: 199900, count: r.count };
          default: return { min: 200000, max: null, count: r.count };
        }
      }),
    };
  },

  async suggest(q: string, limit: number) {
    const db = getDb();
    // MVP: ILIKE title. (If pg_trgm available, switch to similarity and order by similarity DESC)
    const out = await db.query<{ title: string; slug: string; primary_image_url: string | null }>(
      `SELECT
         p.title,
         p.slug,
         (
           SELECT pi.url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.position ASC, pi.id ASC
           LIMIT 1
         ) AS primary_image_url
       FROM products p
       WHERE p.deleted_at IS NULL
         AND p.active = TRUE
         AND p.title ILIKE $1
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [`%${q}%`, limit]
    );
    return out.rows;
  },
};
