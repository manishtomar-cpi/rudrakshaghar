// apps/api/src/middlewares/requireRole.ts
import type { Request, Response, NextFunction } from "express";
import { Errors } from "../utils/errors";

export function requireRole(role: "OWNER" | "CUSTOMER") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(Errors.Unauthorized());
    if (req.auth.role !== role) return next(Errors.Forbidden());
    return next();
  };
}
