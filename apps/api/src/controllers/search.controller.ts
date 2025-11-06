// apps/api/src/controllers/search.controller.ts
import type { Request, Response, NextFunction } from "express";
import { SearchService } from "../services/search.service";
import { SearchProductsQuerySchema, SuggestQuerySchema } from "../validators/search.schemas";

export const SearchController = {
  async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const q = SearchProductsQuerySchema.parse(req.query);
      const out = await SearchService.searchProducts({
        ...q,
        sort: (q.sort ?? "-created_at"),
        include: (q.include ?? "primary"),
      });

      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
      return res.json(out);
    } catch (e) {
      next(e);
    }
  },

  async suggest(req: Request, res: Response, next: NextFunction) {
    try {
      const q = SuggestQuerySchema.parse(req.query);
      const out = await SearchService.suggest(q.q, q.limit ?? 8);
      res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=60");
      return res.json({ items: out });
    } catch (e) {
      next(e);
    }
  },
};
