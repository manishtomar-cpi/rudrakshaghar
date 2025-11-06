// apps/api/src/validators/customer.addresses.schema.ts
import { z } from "zod";

export const AddressCreateSchema = z.object({
  label: z.string().max(60).optional(),
  line1: z.string().min(3),
  line2: z.string().max(120).optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(3).max(12),
  country: z.string().min(2),
  makeDefault: z.boolean().optional(),
});

export const AddressUpdateSchema = z.object({
  label: z.string().max(60).optional(),
  line1: z.string().min(3).optional(),
  line2: z.string().max(120).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pincode: z.string().min(3).max(12).optional(),
  country: z.string().min(2).optional(),
  makeDefault: z.boolean().optional(),
});
