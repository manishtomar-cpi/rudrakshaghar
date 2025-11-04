import { randomUUID } from "crypto";
import { Errors } from "../utils/errors";
import { UserRepo } from "../repositories/user.repo";
import { SessionRepo } from "../repositories/session.repo";
import { signAccessToken } from "../utils/jwt";
import {
  generateRefreshTokenRaw,
  hashPassword,
  verifyPassword,
  hashRefreshToken,
} from "../utils/crypto";
import { security } from "../config/security";

function safeUser(u: {
  id: string;
  role: "OWNER" | "CUSTOMER";
  name: string | null;
  email: string;
  phone: string;
}) {
  return { id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone };
}

export const AuthService = {
  async register(input: { name: string; email: string; phone: string; password: string }) {
    const existing = await UserRepo.findByEmail(input.email);
    if (existing) throw Errors.Conflict("Email already in use");

    const id = randomUUID();
    const password_hash = await hashPassword(input.password);
    const u = await UserRepo.create({
      id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      password_hash,
    });

    const accessToken = signAccessToken(u.id, u.role);
    const rawRt = generateRefreshTokenRaw();
    const rtHash = hashRefreshToken(rawRt);

    const sessionId = randomUUID();
    await SessionRepo.create({
      id: sessionId,
      user_id: u.id,
      refresh_hash: rtHash,
      ttlSec: security.jwt.refreshTtlSec,
    });

    return { user: safeUser(u), accessToken, refreshToken: rawRt };
  },

  async login(input: { email: string; password: string; userAgent?: string; ip?: string }) {
    const u = await UserRepo.findByEmail(input.email);
    if (!u || !u.password_hash) throw Errors.Unauthorized("Invalid credentials");

    const ok = await verifyPassword(input.password, u.password_hash);
    if (!ok) throw Errors.Unauthorized("Invalid credentials");

    const accessToken = signAccessToken(u.id, u.role);
    const rawRt = generateRefreshTokenRaw();
    const rtHash = hashRefreshToken(rawRt);

    const sessionId = randomUUID();
    await SessionRepo.create({
      id: sessionId,
      user_id: u.id,
      refresh_hash: rtHash,
      user_agent: input.userAgent ?? null,
      ip: input.ip ?? null,
      ttlSec: security.jwt.refreshTtlSec,
    });

    return { user: safeUser(u), accessToken, refreshToken: rawRt };
  },

  async refresh(input: { refreshToken?: string }) {
    const raw = input.refreshToken;
    if (!raw) throw Errors.Unauthorized("Missing refresh token");

    const hash = hashRefreshToken(raw);
    const active = await SessionRepo.findActiveByHash(hash);
    if (!active) throw Errors.Unauthorized("Invalid or expired refresh token");

    // rotate session
    const newRt = generateRefreshTokenRaw();
    const newHash = hashRefreshToken(newRt);
    const newId = randomUUID();

    await SessionRepo.create({
      id: newId,
      user_id: active.user_id,
      refresh_hash: newHash,
      ttlSec: security.jwt.refreshTtlSec,
    });
    await SessionRepo.replace(active.id, newId);

    const user = await UserRepo.findById(active.user_id);
    if (!user) throw Errors.Unauthorized("User not found");

    const accessToken = signAccessToken(user.id, user.role);
    return { accessToken, refreshToken: newRt };
  },

  async logout(currentRefreshToken?: string) {
    if (!currentRefreshToken) return; // idempotent
    const hash = hashRefreshToken(currentRefreshToken);
    const active = await SessionRepo.findActiveByHash(hash);
    if (active) await SessionRepo.revoke(active.id);
  },

  async logoutAll(userId: string) {
    await SessionRepo.revokeAllForUser(userId);
  },
};
