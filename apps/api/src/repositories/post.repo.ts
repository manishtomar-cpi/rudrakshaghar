// apps/api/src/repositories/post.repo.ts
import { getDb } from "../modules/db";

type PostRow = {
  id: string;
  image_url: string;
  caption: string | null;
  active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

type LinkedProductRow = {
  post_id: string;
  id: string;             // product id
  title: string;
  slug: string;
  category: "RUDRAKSHA" | "GEMSTONE" | "ACCESSORY";
  price_paise: number;
  primary_image_url: string;
};

export const PostRepo = {
  async listActiveOrdered(): Promise<PostRow[]> {
    const db = getDb();
    const q = await db.query<PostRow>(
      `SELECT id, image_url, caption, active, priority, created_at, updated_at
       FROM posts
       WHERE active = TRUE
       ORDER BY priority ASC, created_at DESC`
    );
    return q.rows;
  },

  /**
   * Returns minimal product cards linked to ANY of the given posts,
   * only for ACTIVE products with a PRIMARY image present.
   */
  async listLinkedProductsForPosts(postIds: string[]): Promise<LinkedProductRow[]> {
    const db = getDb();
    if (postIds.length === 0) return [];

    const q = await db.query<LinkedProductRow>(
      `WITH primary_image AS (
         SELECT DISTINCT ON (pi.product_id)
                pi.product_id,
                pi.url AS primary_image_url
         FROM product_images pi
         ORDER BY pi.product_id, pi.position ASC, pi.id ASC
       )
       SELECT
         pp.post_id,
         p.id,
         p.title,
         p.slug,
         p.category,
         p.price_paise,
         pi.primary_image_url
       FROM post_products pp
       JOIN products p ON p.id = pp.product_id
       JOIN primary_image pi ON pi.product_id = p.id
       WHERE pp.post_id = ANY($1)
         AND p.active = TRUE
         AND p.deleted_at IS NULL
       ORDER BY pp.post_id, p.created_at DESC`,
      [postIds]
    );
    return q.rows;
  },
};
