import { z } from "zod";

const E164 = z.string().regex(/^\+[\d]{10,15}$/, "Must be E.164 (+countrycode...)");
const HTTPS_URL = z.string().url().refine(u => u.startsWith("https://"), { message: "Must be https://" });
const VPA = z.string().regex(/^[a-z0-9.\-_]{2,}@[a-z]{2,}$/i, "Invalid UPI VPA");

export const AppSettingsCreateSchema = z.object({
  businessName: z.string().min(2).max(80),
  supportEmail: z.string().email(),
  supportPhone: E164,
  whatsappNumber: E164,
  upiVpa: VPA,
  upiPayeeName: z.string().min(2).max(80),
  pickupAddress: z.string().min(3),
  currency: z.string().default("INR").optional(),
  logoUrl: HTTPS_URL.optional(),
  returnAddress: z.string().optional(),
  privacyUrl: HTTPS_URL.optional(),
  termsUrl: HTTPS_URL.optional(),
  returnPolicyUrl: HTTPS_URL.optional(),
  upiQrUrl: HTTPS_URL.optional(),
});

export const AppSettingsUpdateSchema = AppSettingsCreateSchema.partial();

export const UpiQrUploadByUrlSchema = z.object({
  url: HTTPS_URL,
});

export type AppSettingsCreateDto = z.infer<typeof AppSettingsCreateSchema>;
export type AppSettingsUpdateDto = z.infer<typeof AppSettingsUpdateSchema>;
