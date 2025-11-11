import { z } from "zod";

/** Keep status limited to queue/history use cases */
const rangeEnum = z.enum(["today", "7d", "30d", "90d", "custom"]);

export const listPaymentsQuerySchema = z.object({
  status: z.enum(["SUBMITTED", "CONFIRMED", "REJECTED"]).optional(), // default SUBMITTED in repo

  // window
  range: rangeEnum.optional(),
  from: z.string().datetime().optional(),   // required when range=custom
  to: z.string().datetime().optional(),
  tz: z.string().optional(),

  // search/sort/pagination
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["created_at", "-created_at"]).optional(),
});

export const paymentConfirmSchema = z.object({
  utr: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const paymentRejectSchema = z.object({
  reason: z.string().min(2).max(500),
});
