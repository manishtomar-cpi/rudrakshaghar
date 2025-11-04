// apps/api/src/validators/auth.schemas.ts
import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  password: z.string().min(8).max(128),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const RefreshSchema = z.object({
  // RT will primarily come from cookie; allow body for mobile clients
  refreshToken: z.string().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
