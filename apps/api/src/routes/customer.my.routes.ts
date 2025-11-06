// apps/api/src/routes/customer.my.routes.ts
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { CustomerMyOrdersController } from "../controllers/customer.my.controller";

const r = Router();

// CUSTOMER-only
r.use(authJwt, requireRole("CUSTOMER"));

/**
 * Phase-4 "my/*" endpoints
 * - List & get order with shipment
 * - Tiny shipment-only read for lightweight polling
 */
r.get("/my/orders", CustomerMyOrdersController.list);
r.get("/my/orders/:id", CustomerMyOrdersController.getOne);
r.get("/my/orders/:id/shipment", CustomerMyOrdersController.getShipment);

/**
 * Back-compat aliases to Phase-3 "me/*" surface
 * (no duplication of logic; just reuse handlers)
 */
r.get("/me/orders", CustomerMyOrdersController.list);
r.get("/me/orders/:id", CustomerMyOrdersController.getOne);
r.get("/me/orders/:id/shipment", CustomerMyOrdersController.getShipment);

export default r;
