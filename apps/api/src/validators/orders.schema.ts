import { z } from "zod";

export const listOrdersQuerySchema = z.object({
  status: z.union([z.string(), z.array(z.string())]).optional(),
  payment_status: z.union([z.string(), z.array(z.string())]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.enum(["created_at", "-created_at", "order_number"]).optional(),
});

export const orderStatusPatchSchema = z.object({
  status: z.enum(["PACKED", "CANCELLED"]),
  reason: z.string().max(500).optional(),
});

export const shipmentPatchSchema = z.object({
  courier_name: z.string().min(1),
  awb_number: z.string().min(1),
  tracking_url: z.string().url().optional(),
});
