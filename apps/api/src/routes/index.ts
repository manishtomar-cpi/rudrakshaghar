// apps/api/src/routes/index.ts
import { Router } from "express";
import { ensureDbConnected, getDb } from "../modules/db";


import authRouter from "./auth.routes";
import ownerProductsRouter from "./owner.products.routes";
import catalogRouter from "./catalog.routes";
import ownerAppSettingsRouter from "./owner.app-settings.routes";
import publicPaymentsRouter from "./public.payments.routes";
import ownerOrdersRouter from "./owner.orders.routes";
import ownerPaymentsRouter from "./owner.payments.routes";
import searchRouter from "./search.routes";
import customerOrdersRouter from "./customer.orders.routes";

import ownerDashboardRouter from "./owner.dashboard.routes";

//  public routers
import publicCatalogAliasesRouter from "./public.catalog.alias.routes";
import homeRouter from "./home.routes";

//  "my orders" router (this file)
import customerMyRouter from "./customer.my.routes";

// These must NOT be mounted at "/" anymore (Phase-3, but we kept aliases)
import customerProfileRouter from "./customer.profile.routes";
import customerAddressesRouter from "./customer.addresses.routes";

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
    console.error("[db/health] error:", err);
    res.status(500).json({ db: "down", error: err?.message ?? "unknown error" });
  }
});

/** ORDER MATTERS: public first, then protected */

// Public
router.use("/catalog", catalogRouter);
router.use("/", publicCatalogAliasesRouter);
router.use("/public", publicPaymentsRouter);
router.use("/home", homeRouter);
router.use("/search", searchRouter);

// Auth
router.use("/auth", authRouter);

// Owner
router.use("/owner", ownerAppSettingsRouter);
router.use("/owner", ownerProductsRouter);
router.use("/owner", ownerOrdersRouter);
router.use("/owner", ownerPaymentsRouter);
router.use("/owner", ownerDashboardRouter);

// Customer —  orders + profile + addresses
router.use("/", customerOrdersRouter);
router.use("/", customerProfileRouter);
router.use("/", customerAddressesRouter);

// Customer - "My Orders & Tracking" (adds /my/* and /me/* shipment tiny read)
router.use("/", customerMyRouter);

export default router;
