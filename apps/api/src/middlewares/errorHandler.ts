// apps/api/src/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

/**
 * Standard JSON error envelope for the web to show toasts:
 * {
 *   error: { code: string, message: string, details?: any, requestId?: string }
 * }
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId;

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Validation failed",
        details: err.flatten(),
        requestId,
      },
    });
  }

  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? undefined, 
        requestId,
      },
    });
  }

  // Unknowns → 500
  console.error("[error]", { requestId, err });
  return res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Something went wrong",
      requestId,
    },
  });
}
