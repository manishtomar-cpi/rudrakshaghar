import { Router } from "express";
import { CatalogController } from "../controllers/catalog.controller";

const r = Router();

r.get("/products", CatalogController.list);
r.get("/products/:slug", CatalogController.detailBySlug);

export default r;
