import type { Request, Response } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import { DashboardService } from "../services/dashboard.service";
import { DashboardQuerySchema } from "../validators/dashboard.schema";
import { AppError } from "../utils/errors";

export class OwnerDashboardController {
  private static async deps() {
    await ensureDbConnected();
    const db = getDb();
    const svc = new DashboardService(db);
    return { svc };
  }

  static async get(req: Request, res: Response) {
    const parsed = DashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("BAD_REQUEST", 400, parsed.error.flatten().formErrors.join(", ") || "Invalid query");
    }
    const { svc } = await OwnerDashboardController.deps();
    const data = await svc.getResponse(parsed.data);
    res.setHeader("Cache-Control", "private, max-age=15, stale-while-revalidate=60");
    return res.json(data);
  }
}
