// apps/api/src/validators/customer.profile.schema.ts
import { z } from "zod";

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80).optional(),
  phone: z
    .string()
    .min(6, "Phone seems too short")
    .max(20, "Phone seems too long")
    .optional(),
});
