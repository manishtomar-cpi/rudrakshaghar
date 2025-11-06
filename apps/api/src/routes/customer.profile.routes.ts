// apps/api/src/routes/customer.profile.routes.ts
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { CustomerProfileController } from "../controllers/customer.profile.controller";

const r = Router();
r.use(authJwt, requireRole("CUSTOMER"));

r.get("/me/profile", CustomerProfileController.getProfile);
r.patch("/me/profile", CustomerProfileController.updateProfile);

export default r;
