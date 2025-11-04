// apps/api/src/utils/cookies.ts
import type { Response } from "express";
import { security } from "../config/security";

export function setRefreshCookie(res: Response, value: string, maxAgeSec: number) {
  res.cookie(security.cookies.refreshName, value, {
    httpOnly: true,
    secure: security.cookies.secure,
    sameSite: security.cookies.sameSite,
    path: security.cookies.refreshPath,
    domain: security.cookies.domain,
    maxAge: maxAgeSec * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(security.cookies.refreshName, {
    httpOnly: true,
    secure: security.cookies.secure,
    sameSite: security.cookies.sameSite,
    path: security.cookies.refreshPath,
    domain: security.cookies.domain,
  });
}
