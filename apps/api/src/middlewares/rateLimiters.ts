// apps/api/src/middlewares/rateLimiters.ts
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
