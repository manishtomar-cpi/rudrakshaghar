import { Router } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import authRouter from "./auth.routes";

const router = Router();

// ---------- Health Endpoints ----------
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

// ---------- Feature Routes ----------
router.use("/auth", authRouter);

export default router;
