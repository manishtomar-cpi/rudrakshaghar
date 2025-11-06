// apps/api/src/validators/orders.customer.schemas.ts
import { z } from "zod";

export const CreateOrderBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        qty: z.coerce.number().int().min(1).max(10),
      })
    )
    .min(1)
    .max(50),
  addressId: z.string().uuid(),
});

export const ListOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const SubmitProofBodySchema = z.object({
  ref: z.string().trim().max(50).optional(),
});
