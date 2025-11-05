import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import { ProductListQuerySchema } from "../validators/catalog.schemas";

export const CatalogController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ProductListQuerySchema.parse(req.query);
      const out = await ProductService.list({
        ...q,
        active: true,                          // public only sees active
        include: q.include ?? "primary",       // default primary image for public grid
      });
      return res.json(out);
    } catch (e) {
      next(e);
    }
  },

  async detailBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ProductService.getPublicDetail(req.params.slug);
      return res.json(data);
    } catch (e) {
      next(e);
    }
  },
};
