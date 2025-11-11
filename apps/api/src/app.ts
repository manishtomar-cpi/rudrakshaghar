// apps/api/src/app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { mountSwagger } from "./config/swagger";
import router from "./routes";
import { env } from "./config/env";
import { requestId } from "./middlewares/requestId";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler"; 

const app = express();
app.set("etag", false);
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  next();
});

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

// Optional redirect for non-/api/v1 callers
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
app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Not Found" } }));

// Centralized error handler
app.use(errorHandler); 

export default app;
