import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.trim() !== "" ? incoming : randomUUID();

  (req as any).id = id;                 
  res.setHeader("X-Request-Id", id);
  next();
}
