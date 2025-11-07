import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { OwnerDashboardController } from "../controllers/owner.dashboard.controller";

const r = Router();

r.use(authJwt, requireRole("OWNER"));
r.get("/dashboard", OwnerDashboardController.get);

export default r;
