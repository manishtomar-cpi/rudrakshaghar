// apps/api/src/config/security.ts
import { env } from "./env";

function parseTtlToSeconds(ttl: string): number {
  // supports "15m", "14d", "900" (seconds)
  if (/^\d+$/.test(ttl)) return parseInt(ttl, 10);
  const m = ttl.match(/^(\d+)([smhd])$/i);
  if (!m) throw new Error(`Invalid TTL: ${ttl}`);
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const map: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * map[unit];
}

export const security = {
  jwt: {
    iss: env.JWT_ISS,
    aud: env.JWT_AUD,
    secret: env.API_JWT_SECRET,
    accessTtlSec: parseTtlToSeconds(env.JWT_ACCESS_TTL),
    refreshTtlSec: parseTtlToSeconds(env.JWT_REFRESH_TTL),
  },
  cookies: {
    refreshName: "rt",
    refreshPath: "/api/v1/auth/refresh",
    domain: env.COOKIE_DOMAIN,
    secure: env.COOKIE_SECURE,
    sameSite: "lax" as const,
  },
};
