// validators/shared.window.schema.ts
import { z } from "zod";

export const windowQuerySchema = z.object({
  range: z.enum(["today", "7d", "30d", "90d", "custom"]).default("7d"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  tz: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
});
