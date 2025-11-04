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
import { AppError } from "./utils/errors";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN ?? true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// request id + access log
app.use(requestId);
app.use(logger);

// swagger
mountSwagger(app);

// routes
app.use("/api/v1", router);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// error handler (uniform)
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.name === "ZodError") {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Validation failed", details: err.errors }});
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message }});
  }
  console.error(err);
  return res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" }});
});

export default app;
