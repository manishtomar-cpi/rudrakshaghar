// apps/api/src/routes/customer.orders.routes.ts
import { Router } from "express";
import multer from "multer";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { CustomerOrderController } from "../controllers/customer.order.controller";

const r = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Protect everything
r.use(authJwt, requireRole("CUSTOMER"));

// Create order (no /me here by design)
r.post("/orders", CustomerOrderController.create);

// My orders
r.get("/me/orders", CustomerOrderController.listMine);
r.get("/me/orders/:id", CustomerOrderController.getMine);

// Submit manual UPI proof
r.post(
  "/me/orders/:id/payment/proof",
  upload.single("file"),
  CustomerOrderController.submitProof
);

export default r;
