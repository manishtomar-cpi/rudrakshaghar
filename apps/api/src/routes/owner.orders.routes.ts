import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { OwnerOrderController } from "../controllers/owner.order.controller";

const r = Router();

// OWNER-only
r.use(authJwt, requireRole("OWNER"));

// List + detail
r.get("/orders", OwnerOrderController.list);
r.get("/orders/:id", OwnerOrderController.get);

// Status transitions
r.patch("/orders/:id/status", OwnerOrderController.updateStatus);

// Shipment
r.patch("/orders/:id/shipment", OwnerOrderController.upsertShipment);
r.patch("/orders/:id/delivered", OwnerOrderController.markDelivered);

export default r;
