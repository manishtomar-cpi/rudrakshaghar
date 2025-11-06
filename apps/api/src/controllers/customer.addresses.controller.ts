// apps/api/src/controllers/customer.addresses.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AddressesService } from "../services/addresses.service";
import { AddressCreateSchema, AddressUpdateSchema } from "../validators/customer.addresses.schema";
import { AppError } from "../utils/errors";

export const CustomerAddressesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const out = await AddressesService.list(req.auth.userId);
      return res.json({ items: out });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const input = AddressCreateSchema.parse(req.body);
      const out = await AddressesService.create(req.auth.userId, input);
      return res.status(201).json(out);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const { id } = req.params;
      const input = AddressUpdateSchema.parse(req.body);
      const out = await AddressesService.update(req.auth.userId, id, input);
      return res.json(out);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const { id } = req.params;
      await AddressesService.remove(req.auth.userId, id);
      return res.status(204).send();
    } catch (err) { next(err); }
  },

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const { id } = req.params;
      const out = await AddressesService.setDefault(req.auth.userId, id);
      return res.json(out);
    } catch (err) { next(err); }
  },
};
