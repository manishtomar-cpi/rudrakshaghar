import { z } from "zod";

export const listPaymentsQuerySchema = z.object({
  status: z.union([z.string(), z.array(z.string())]).optional(), // default applied in repo to SUBMITTED
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.enum(["created_at", "-created_at"]).optional(),
});

export const paymentConfirmSchema = z.object({
  utr: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const paymentRejectSchema = z.object({
  reason: z.string().min(2).max(500),
});
