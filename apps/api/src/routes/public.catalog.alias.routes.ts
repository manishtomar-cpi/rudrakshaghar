// apps/api/src/routes/public.catalog.alias.routes.ts
import { Router } from "express";
import { CatalogController } from "../controllers/catalog.controller";

/**
 * Public aliases for catalog (no auth).
 * /products -> list
 * /products/:slug -> detail by slug
 */
const r = Router();

r.get("/products", CatalogController.list);
r.get("/products/:slug", CatalogController.detailBySlug);

export default r;
