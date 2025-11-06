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

// Phase-2 public routers
import publicCatalogAliasesRouter from "./public.catalog.alias.routes";
import homeRouter from "./home.routes";

//These must NOT be mounted at "/" anymore
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

/** ORDER MATTERS: mount PUBLIC first, then protected. */

// --- Public endpoints (no auth) ---
router.use("/catalog", catalogRouter);           // GET /catalog/products, /catalog/products/:slug
router.use("/", publicCatalogAliasesRouter);     // GET /products, /products/:slug
router.use("/public", publicPaymentsRouter);     // GET /public/payments/config
router.use("/home", homeRouter);                 // GET /home/posts
router.use("/search", searchRouter);

// --- Auth endpoints ---
router.use("/auth", authRouter);

// --- Owner (protected inside each router with authJwt/requireRole) ---
router.use("/owner", ownerAppSettingsRouter);
router.use("/owner", ownerProductsRouter);
router.use("/owner", ownerOrdersRouter);
router.use("/owner", ownerPaymentsRouter);

// --- Customer 
router.use("/customer", customerProfileRouter);   // e.g. /customer/me
router.use("/customer", customerAddressesRouter); // e.g. /customer/addresses

export default router;
