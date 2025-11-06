// apps/api/src/routes/home.routes.ts
import { Router } from "express";
import { HomeController } from "../controllers/home.controller";

const r = Router();

// Public: promos + linked products
r.get("/posts", HomeController.listPosts);

export default r;
