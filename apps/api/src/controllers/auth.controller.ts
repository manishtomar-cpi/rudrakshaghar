// apps/api/src/controllers/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { RegisterSchema, LoginSchema, RefreshSchema } from "../validators/auth.schemas";
import { setRefreshCookie, clearRefreshCookie } from "../utils/cookies";
import { security } from "../config/security";

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = RegisterSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.register(input);
      setRefreshCookie(res, refreshToken, security.jwt.refreshTtlSec);
      return res.status(201).json({ user, accessToken,refreshToken });
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = LoginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.login({
        ...input,
        userAgent: req.get("user-agent") ?? undefined,
        ip: req.ip,
      });
      setRefreshCookie(res, refreshToken, security.jwt.refreshTtlSec);
      return res.json({ user, accessToken, refreshToken });
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RefreshSchema.parse(req.body ?? {});
      const bodyRt = parsed.refreshToken;
      const cookieRt = req.cookies?.[security.cookies.refreshName] as string | undefined;

      const inRt = bodyRt ?? cookieRt;
      const { accessToken, refreshToken } = await AuthService.refresh({ refreshToken: inRt });
      setRefreshCookie(res, refreshToken, security.jwt.refreshTtlSec);
      return res.json({ accessToken });
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response) {
    // client calls with AT in header; only returns identity
    return res.json({ userId: req.auth?.userId, role: req.auth?.role });
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const cookieRt = req.cookies?.[security.cookies.refreshName] as string | undefined;
      await AuthService.logout(cookieRt);
      clearRefreshCookie(res);
      return res.status(204).send();
    } catch (err) { next(err); }
  },

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
      await AuthService.logoutAll(req.auth.userId);
      clearRefreshCookie(res);
      return res.status(204).send();
    } catch (err) { next(err); }
  },
};
