// apps/api/src/routes/search.routes.ts
import { Router } from "express";
import { SearchController } from "../controllers/search.controller";

const r = Router();

// Public search endpoints (no auth)
r.get("/products", SearchController.searchProducts);
r.get("/suggest", SearchController.suggest);

export default r;
