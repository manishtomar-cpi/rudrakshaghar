import { z } from "zod";

export const groupByEnum = z.enum(["day", "week", "month"]);

export const revenueSummaryQuerySchema = z.object({
  // window
  range: z.enum(["today", "7d", "30d", "custom"]).optional(),
  tz: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),

  // filters
  productId: z.string().uuid().optional(),
  category: z.enum(["RUDRAKSHA", "GEMSTONE", "ACCESSORY"]).optional(),
});

export const revenueTrendQuerySchema = revenueSummaryQuerySchema.extend({
  groupBy: groupByEnum.default("day"),
});

export const topProductsQuerySchema = revenueSummaryQuerySchema.extend({
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const revenueOrdersQuerySchema = revenueSummaryQuerySchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["PLACED","PAYMENT_SUBMITTED","PAYMENT_CONFIRMED","PACKED","SHIPPED","DELIVERED","CANCELLED"]).optional(),
  needsShipment: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
  sort: z.enum(["created_at","-created_at","order_number"]).optional(),
});
