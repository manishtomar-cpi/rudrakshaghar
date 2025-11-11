import { z } from "zod";

/** Shared time-window model used across owner screens */
const rangeEnum = z.enum(["today", "7d", "30d", "90d", "custom"]);

export const listOrdersQuerySchema = z.object({
  // filters
  status: z.union([z.string(), z.array(z.string())]).optional(),
  payment_status: z.union([z.string(), z.array(z.string())]).optional(),
  needsShipment: z.coerce.boolean().optional(),

  // window
  range: rangeEnum.optional(),
  from: z.string().datetime().optional(),   // required when range=custom
  to: z.string().datetime().optional(),
  tz: z.string().optional(),                 // e.g. "Asia/Kolkata"

  // search/sort/pagination
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
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
