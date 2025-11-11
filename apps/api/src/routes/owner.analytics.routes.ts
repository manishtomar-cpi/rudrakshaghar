import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { OwnerAnalyticsController } from "../controllers/owner.analytics.controller";

const r = Router();
r.use(authJwt, requireRole("OWNER"));

// KPIs
r.get("/analytics/revenue/summary", OwnerAnalyticsController.revenueSummary);
// Trend
r.get("/analytics/revenue/trend", OwnerAnalyticsController.revenueTrend);
// Top products
r.get("/analytics/top-products", OwnerAnalyticsController.topProducts);
// Detailed revenue orders (paginated)
r.get("/analytics/revenue/orders", OwnerAnalyticsController.revenueOrders);

export default r;
