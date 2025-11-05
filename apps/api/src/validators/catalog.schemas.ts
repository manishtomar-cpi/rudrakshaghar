import { z } from "zod";

export const ProductCategory = z.enum(["RUDRAKSHA", "GEMSTONE", "ACCESSORY"]);

export const ProductCreateSchema = z.object({
  title: z.string().min(1).max(140),
  category: ProductCategory,
  price_paise: z.number().int().nonnegative(),
  description: z.string().optional(),
  authenticity_note: z.string().optional(),
  active: z.boolean().optional().default(true),
  stock_qty: z.number().int().nonnegative().nullable().optional(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductListQuerySchema = z.object({
  q: z.string().optional(),
  category: ProductCategory.optional(),
  active: z.coerce.boolean().optional(),

  // extra filters
  min_price_paise: z.coerce.number().int().nonnegative().optional(),
  max_price_paise: z.coerce.number().int().nonnegative().optional(),
  in_stock: z.coerce.boolean().optional(),        // stock_qty > 0
  has_images: z.coerce.boolean().optional(),      // EXISTS product_images
  created_from: z.string().datetime().optional(), // ISO string
  created_to: z.string().datetime().optional(),

  // images expansion for list APIs
  include: z.enum(["none", "primary", "images"]).default("none"),
  images_limit: z.coerce.number().int().positive().max(10).default(5),

  // pagination & sort
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z
    .enum(["created_at", "-created_at", "price_paise", "-price_paise", "title", "-title"])
    .default("-created_at"),
});

export const ImageOrderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    position: z.number().int().nonnegative(),
  })
);

export const VariantCreateSchema = z.object({
  label: z.string().min(1).max(80),
  price_paise: z.number().int().nonnegative().optional(),
  sku: z.string().min(1).max(80).optional(),
  active: z.boolean().optional().default(true),
});
export const VariantUpdateSchema = VariantCreateSchema.partial();
