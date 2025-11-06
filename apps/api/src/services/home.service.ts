// apps/api/src/services/home.service.ts
import { PostRepo } from "../repositories/post.repo";

export type PostWithProducts = {
  id: string;
  image_url: string;
  caption: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  products: Array<{
    id: string;
    title: string;
    slug: string;
    category: "RUDRAKSHA" | "GEMSTONE" | "ACCESSORY";
    price_paise: number;
    primary_image_url: string;
  }>;
};

export const HomeService = {
  async listPosts(): Promise<PostWithProducts[]> {
    const posts = await PostRepo.listActiveOrdered();
    if (posts.length === 0) return [];

    const postIds = posts.map(p => p.id);
    const linked = await PostRepo.listLinkedProductsForPosts(postIds);

    // group products by post_id
    const map = new Map<string, PostWithProducts["products"]>();
    for (const row of linked) {
      if (!map.has(row.post_id)) map.set(row.post_id, []);
      map.get(row.post_id)!.push({
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        price_paise: row.price_paise,
        primary_image_url: row.primary_image_url,
      });
    }

    return posts.map(p => ({
      id: p.id,
      image_url: p.image_url,
      caption: p.caption,
      priority: p.priority,
      created_at: p.created_at,
      updated_at: p.updated_at,
      products: map.get(p.id) ?? [],
    }));
  },
};
