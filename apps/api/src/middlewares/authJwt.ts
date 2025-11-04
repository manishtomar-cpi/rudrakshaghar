import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { Errors } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: "OWNER" | "CUSTOMER" };
    }
  }
}

export function authJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) return next(Errors.Unauthorized());

  const token = header.substring("Bearer ".length).trim();
  try {
    const { userId, role } = verifyAccessToken(token);
    req.auth = { userId, role };
    return next();
  } catch {
    return next(Errors.Unauthorized());
  }
}
