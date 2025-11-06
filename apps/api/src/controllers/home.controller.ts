// apps/api/src/controllers/home.controller.ts
import type { Request, Response, NextFunction } from "express";
import { HomeService } from "../services/home.service";

export const HomeController = {
  async listPosts(_req: Request, res: Response, next: NextFunction) {
    try {
      const out = await HomeService.listPosts();
      // Lightweight caching for public home feed
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=600");
      return res.json({ items: out });
    } catch (e) {
      next(e);
    }
  },
};
