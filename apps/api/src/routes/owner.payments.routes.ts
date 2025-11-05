import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { OwnerPaymentController } from "../controllers/owner.payment.controller";

const r = Router();

// OWNER-only
r.use(authJwt, requireRole("OWNER"));

// Queues + actions
r.get("/payments", OwnerPaymentController.list);
r.post("/payments/:orderId/confirm", OwnerPaymentController.confirm);
r.post("/payments/:orderId/reject", OwnerPaymentController.reject);

export default r;
