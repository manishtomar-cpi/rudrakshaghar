import { Router } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import authRouter from "./auth.routes";
import ownerProductsRouter from "./owner.products.routes";
import catalogRouter from "./catalog.routes";
import ownerAppSettingsRouter from "./owner.app-settings.routes";
import publicPaymentsRouter from "./public.payments.routes";

const router = Router();

/** Health */
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
    // eslint-disable-next-line no-console
    console.error("[db/health] error:", err);
    res
      .status(500)
      .json({ db: "down", error: err?.message ?? "unknown error" });
  }
});

/**
 * Feature routes (ORDER MATTERS)
 */
router.use("/auth", authRouter);

// Mount App Settings BEFORE ownerProducts so it can't be shadowed
router.use("/owner", ownerAppSettingsRouter); // /owner/app-settings...

router.use("/owner", ownerProductsRouter); // products, images, variants...
router.use("/catalog", catalogRouter); // public reads
router.use("/public", publicPaymentsRouter); // /public/payments/config

export default router;
