import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { OwnerPaymentController } from "../controllers/owner.payment.controller";

const r = Router();

r.use(authJwt, requireRole("OWNER"));

r.get("/payments", OwnerPaymentController.list);
r.get("/payments/reject-reasons", OwnerPaymentController.rejectReasons); 
r.post("/payments/:orderId/confirm", OwnerPaymentController.confirm);
r.post("/payments/:orderId/reject", OwnerPaymentController.reject);

export default r;
