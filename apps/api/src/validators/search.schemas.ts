// apps/api/src/validators/search.schemas.ts
import { z } from "zod";

const CategoryEnum = z.enum(["RUDRAKSHA", "GEMSTONE", "ACCESSORY"]);

export const SearchProductsQuerySchema = z.object({
  q: z.string().trim().min(1).max(64).optional(),
  category: z.union([CategoryEnum, z.array(CategoryEnum)]).optional(),
  min_price_paise: z.coerce.number().int().nonnegative().optional(),
  max_price_paise: z.coerce.number().int().nonnegative().optional(),
  in_stock: z.coerce.boolean().optional(),
  has_images: z.coerce.boolean().optional(),
  include: z.enum(["none", "primary", "images"]).default("primary").optional(),
  images_limit: z.coerce.number().int().min(1).max(20).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["created_at", "-created_at", "price_paise", "-price_paise", "title", "-title"])
    .default("-created_at")
    .optional(),
});

export const SuggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(64),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});
