import { Router } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import authRouter from "./auth.routes";
import ownerProductsRouter from "./owner.products.routes";
import catalogRouter from "./catalog.routes";

const router = Router();

// health
router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});
router.get("/db/health", async (_req, res) => {
  try {
    await ensureDbConnected();
    const db = getDb();
    const result = await db.query("select 1 as ok");
    res.json({ db: "up", result: result.rows[0] });
  } catch (err: any) {
    console.error("[db/health] error:", err);
    res.status(500).json({ db: "down", error: err?.message ?? "unknown error" });
  }
});

// feature routes
router.use("/auth", authRouter);
router.use("/owner", ownerProductsRouter);   // OWNER-only mutations
router.use("/catalog", catalogRouter);       // public reads

export default router;
