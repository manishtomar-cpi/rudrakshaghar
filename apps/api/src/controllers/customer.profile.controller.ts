// apps/api/src/controllers/customer.profile.controller.ts
import type { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service";
import { UpdateProfileSchema } from "../validators/customer.profile.schema";
import { AppError } from "../utils/errors";

export const CustomerProfileController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const out = await ProfileService.getProfile(req.auth.userId);
      return res.json(out);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const parsed = UpdateProfileSchema.parse(req.body);
      const out = await ProfileService.updateProfile(req.auth.userId, parsed);
      return res.json(out);
    } catch (err) {
      next(err);
    }
  },
};
