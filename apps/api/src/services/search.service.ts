// apps/api/src/services/search.service.ts
import { SearchRepo } from "../repositories/search.repo";

export type SearchProductsParams = {
  q?: string;
  category?:
    | "RUDRAKSHA"
    | "GEMSTONE"
    | "ACCESSORY"
    | Array<"RUDRAKSHA" | "GEMSTONE" | "ACCESSORY">;
  min_price_paise?: number;
  max_price_paise?: number;
  in_stock?: boolean;
  has_images?: boolean;
  include?: "none" | "primary" | "images";
  images_limit?: number;
  page?: number;       // make optional; we’ll default
  pageSize?: number;   // make optional; we’ll default
  sort?:
    | "created_at"
    | "-created_at"
    | "price_paise"
    | "-price_paise"
    | "title"
    | "-title";
};

export const SearchService = {
  async searchProducts(params: SearchProductsParams) {
    // normalise arrays
    const categories = Array.isArray(params.category)
      ? params.category
      : params.category
      ? [params.category]
      : undefined;

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const include = params.include ?? "primary";
    const sort =
      params.sort ??
      (params.q ? "-created_at" : "-created_at"); // default when undefined

    const { items, total } = await SearchRepo.page({
      ...params,
      category: categories,
      page,
      pageSize,
      include,
      sort,
    });

    const facets = await SearchRepo.facets({
      ...params,
      category: categories,
    });

    return {
      items,
      page,
      pageSize,
      total,
      facets,
    };
  },

  async suggest(q: string, limit: number) {
    const lim = Math.min(10, Math.max(1, limit || 8));
    return SearchRepo.suggest(q, lim);
  },
};
