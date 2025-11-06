// apps/api/src/controllers/customer.order.controller.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CustomerOrdersService } from "../services/customer.orders.service";
import {
  CreateOrderBodySchema,
  ListOrdersQuerySchema,
  SubmitProofBodySchema,
} from "../validators/orders.customer.schemas";
import { AppError } from "../utils/errors";

function getActorUserId(req: Request): string {
  const id = (req as any)?.user?.userId;
  if (!id) throw new AppError("UNAUTHORIZED", 401, "Unauthorized");
  return String(id);
}

export const CustomerOrderController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getActorUserId(req);
      const body = CreateOrderBodySchema.parse(req.body);

      // Optional idempotency
      const idemKey = req.header("Idempotency-Key") ?? undefined;

      const out = await CustomerOrdersService.placeOrder({
        userId,
        items: body.items,
        addressId: body.addressId,
        idempotencyKey: idemKey,
      });

      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getActorUserId(req);
      const q = ListOrdersQuerySchema.parse(req.query);

      const result = await CustomerOrdersService.listMyOrders({
        userId,
        page: q.page,
        pageSize: q.pageSize,
      });

      res.setHeader("Cache-Control", "private, max-age=10");
      return res.json(result);
    } catch (e) {
      next(e);
    }
  },

  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getActorUserId(req);
      const id = z.string().uuid().parse(req.params.id);

      const result = await CustomerOrdersService.getMyOrder({ userId, orderId: id });
      if (!result) throw new AppError("NOT_FOUND", 404, "Not found");

      res.setHeader("Cache-Control", "private, max-age=10");
      return res.json(result);
    } catch (e) {
      next(e);
    }
  },

  async submitProof(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getActorUserId(req);
      const orderId = z.string().uuid().parse(req.params.id);
      const { ref } = SubmitProofBodySchema.parse(req.body);

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) throw new AppError("BAD_REQUEST", 400, "Proof image is required");

      const result = await CustomerOrdersService.submitPaymentProof({
        userId,
        orderId,
        file,
        referenceText: ref,
      });

      return res.json(result);
    } catch (e) {
      next(e);
    }
  },
};
