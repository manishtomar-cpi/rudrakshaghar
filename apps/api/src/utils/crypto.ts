// apps/api/src/utils/crypto.ts
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

// Refresh token is raw random bytes encoded as base64url; we store only a SHA-256 hash.
export function generateRefreshTokenRaw(): string {
  return crypto.randomBytes(48).toString("base64url"); // 384 bits
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}
