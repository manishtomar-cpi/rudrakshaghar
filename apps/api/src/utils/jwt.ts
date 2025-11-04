import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { security } from "../config/security";

export type Role = "OWNER" | "CUSTOMER";

export interface AccessTokenClaims extends JwtPayload {
  role: Role;
}

/**
 * Create a short-lived access token containing the user's role.
 */
export function signAccessToken(userId: string, role: Role): string {
  const payload: AccessTokenClaims = { role };
  const opts: SignOptions = {
    algorithm: "HS256",
    issuer: security.jwt.iss,
    audience: security.jwt.aud,
    expiresIn: security.jwt.accessTtlSec, // seconds
    subject: userId,
  };
  return jwt.sign(payload, security.jwt.secret, opts);
}

/**
 * Verify an access token and extract { userId, role }.
 */
export function verifyAccessToken(token: string): { userId: string; role: Role } {
  const decoded = jwt.verify(token, security.jwt.secret, {
    algorithms: ["HS256"],
    issuer: security.jwt.iss,
    audience: security.jwt.aud,
  }) as AccessTokenClaims & { sub?: string };

  const userId = decoded.sub;
  const role = decoded.role;
  if (!userId || !role) {
    throw new Error("Invalid token claims");
  }
  return { userId, role };
}
