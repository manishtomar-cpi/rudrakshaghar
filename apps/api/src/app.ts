import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { mountSwagger } from "./config/swagger";
import router from "./routes";
import { env } from "./config/env";
import { requestId } from "./middlewares/requestId";
import { logger } from "./middlewares/logger";
import { AppError } from "./utils/errors";

const app = express();

// Security headers (disable CSP so Swagger UI can inject scripts)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN ?? true,
    credentials: true,
  })
);

// Helpful behind proxies
app.set("trust proxy", 1);

// Parsers
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Request metadata & logs
app.use(requestId);
app.use(logger);

// Swagger UI at /api-docs
mountSwagger(app);

// API routes mounted at /api/v1
app.use("/api/v1", router);

/**
 * Optional convenience redirect:
 * If someone calls /owner/*, /public/*, /catalog/*, /health, /db/health
 * without the /api/v1 prefix, redirect them permanently to the right place.
 */
app.use((req, res, next) => {
  const p = req.path;
  const needsBase =
    p.startsWith("/owner") ||
    p.startsWith("/public") ||
    p.startsWith("/catalog") ||
    p === "/health" ||
    p.startsWith("/db/health");

  if (needsBase && !p.startsWith("/api/v1/")) {
    const qs = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
    return res.redirect(308, `/api/v1${p}${qs}`);
  }
  next();
});

// 404
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// Centralized error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.name === "ZodError") {
    return res
      .status(400)
      .json({ error: { code: "BAD_REQUEST", message: "Validation failed", details: err.errors } });
  }
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
});

export default app;
