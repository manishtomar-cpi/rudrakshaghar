import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductListQuerySchema,
  ImageOrderSchema,
  VariantCreateSchema,
  VariantUpdateSchema,
} from "../validators/catalog.schemas";

export const OwnerProductController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = ProductCreateSchema.parse(req.body);
      const p = await ProductService.create(input);
      return res.status(201).json(p);
    } catch (e) { next(e); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ProductListQuerySchema.parse(req.query);
      const out = await ProductService.list(q);
      return res.json(out);
    } catch (e) { next(e); }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const p = await ProductService.get(req.params.id);
      return res.json(p);
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const patch = ProductUpdateSchema.parse(req.body);
      const p = await ProductService.update(req.params.id, patch);
      return res.json(p);
    } catch (e) { next(e); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.softDelete(req.params.id);
      return res.status(204).send();
    } catch (e) { next(e); }
  },

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) return res.status(400).json({ error: { code: "BAD_REQUEST", message: "image is required" }});
      const created = await ProductService.uploadImage({
        productId: req.params.id,
        buffer: req.file.buffer,
        fileName: req.file.originalname,
        mime: req.file.mimetype,
      });
      return res.status(201).json(created);
    } catch (e) { next(e); }
  },

  async reorderImages(req: Request, res: Response, next: NextFunction) {
    try {
      const order = ImageOrderSchema.parse(req.body);
      await ProductService.reorderImages(req.params.id, order);
      return res.status(204).send();
    } catch (e) { next(e); }
  },

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteImage(req.params.id, req.params.imageId);
      return res.status(204).send();
    } catch (e) { next(e); }
  },

  async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const body = VariantCreateSchema.parse(req.body);
      const v = await ProductService.createVariant(req.params.id, body);
      return res.status(201).json(v);
    } catch (e) { next(e); }
  },

  async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const body = VariantUpdateSchema.parse(req.body);
      const v = await ProductService.updateVariant(req.params.id, req.params.variantId, body);
      return res.json(v);
    } catch (e) { next(e); }
  },

  async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteVariant(req.params.id, req.params.variantId);
      return res.status(204).send();
    } catch (e) { next(e); }
  },
};
