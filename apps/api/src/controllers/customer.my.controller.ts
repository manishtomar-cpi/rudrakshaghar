// apps/api/src/controllers/customer.my.controller.ts
import type { Request, Response, NextFunction } from "express";
import { CustomerOrdersRepo } from "../repositories/customerOrders.repo";
import { AppError } from "../utils/errors";

function actorId(req: Request): string {
  const id = (req as any)?.user?.userId;
  if (!id) throw AppError.unauthorized("Missing actor");
  return String(id);
}

const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 10;
const LIMIT_MAX = 100;

export const CustomerMyOrdersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = actorId(req);
      const status = req.query.status
        ? String(req.query.status).toUpperCase()
        : undefined;

      const page = Math.max(PAGE_DEFAULT, parseInt(String(req.query.page ?? PAGE_DEFAULT), 10) || PAGE_DEFAULT);
      const limitRaw = parseInt(String(req.query.limit ?? req.query.pageSize ?? LIMIT_DEFAULT), 10) || LIMIT_DEFAULT;
      const pageSize = Math.min(LIMIT_MAX, Math.max(1, limitRaw));

      const { items, total } = await CustomerOrdersRepo.listForUserWithShipment({
        userId,
        status,
        page,
        pageSize,
      });

      return res.json({ items, page, pageSize, total });
    } catch (e) {
      next(e);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = actorId(req);
      const orderId = String(req.params.id);

      const data = await CustomerOrdersRepo.getByIdForUserWithShipment(orderId, userId);
      if (!data) throw AppError.notFound("Order not found");

      return res.json(data);
    } catch (e) {
      next(e);
    }
  },

  async getShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = actorId(req);
      const orderId = String(req.params.id);

      const shipment = await CustomerOrdersRepo.getShipmentForOrder(orderId, userId);
      if (!shipment) throw AppError.notFound("Shipment not found");

      return res.json({ shipment });
    } catch (e) {
      next(e);
    }
  },
};
