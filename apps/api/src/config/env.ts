import "dotenv/config";
import { z } from "zod";

const ttlPattern = /^(\d+)([smhd])$/i; // e.g., 15m, 14d, 900 (handled below)

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),

  // DB & CORS
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  CORS_ORIGIN: z.string().optional(), // allow any origin in dev if not set

  // JWT core
  API_JWT_SECRET: z.string().min(8, "API_JWT_SECRET must be at least 8 chars"),
  JWT_ISS: z.string().default("rudraksha.api"),
  JWT_AUD: z.string().default("rudraksha.clients"),

  // lifetimes (accept "900" or "15m/14d")
  JWT_ACCESS_TTL: z
    .string()
    .default("15m")
    .refine((v) => /^\d+$/.test(v) || ttlPattern.test(v), "Use seconds or 15m/14d formats"),
  JWT_REFRESH_TTL: z
    .string()
    .default("14d")
    .refine((v) => /^\d+$/.test(v) || ttlPattern.test(v), "Use seconds or 15m/14d formats"),

  // cookies
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => (v ?? "false").toLowerCase() === "true"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
