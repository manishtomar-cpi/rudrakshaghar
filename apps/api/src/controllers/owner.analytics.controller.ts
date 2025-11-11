import type { Request, Response } from "express";
import { ensureDbConnected, getDb } from "../modules/db";
import { AnalyticsRepo } from "../repositories/analytics.repo";
import { DashboardService } from "../services/dashboard.service";
import { revenueOrdersQuerySchema, revenueSummaryQuerySchema, revenueTrendQuerySchema, topProductsQuerySchema } from "../validators/analytics.schema";

export class OwnerAnalyticsController {
  private static async deps() {
    await ensureDbConnected();
    const db = getDb();
    const repo = new AnalyticsRepo(db);
    const dash = new DashboardService(db);
    return { repo, dash };
  }

  private static windowFromQuery(dash: DashboardService, q: { range?: any; tz?: string; from?: string; to?: string }) {
    if (q.range) {
      const w = dash.computeWindow({
        range: q.range,
        tz: q.tz,
        from: q.from,
        to: q.to,
        limit: 5,
        include: new Set(),
      } as any);
      return { fromIso: w.fromIso, toIso: w.toIso };
    }
    return { fromIso: q.from!, toIso: q.to! };
  }

  static async revenueSummary(req: Request, res: Response) {
    const parsed = revenueSummaryQuerySchema.parse(req.query);
    const { repo, dash } = await OwnerAnalyticsController.deps();
    const { fromIso, toIso } = OwnerAnalyticsController.windowFromQuery(dash, parsed);

    const s = await repo.revenueSummary({
      fromIso, toIso,
      productId: parsed.productId,
      category: parsed.category,
    });

    return res.json({
      window: { from: fromIso, to: toIso, tz: parsed.tz },
      kpis: {
        revenue_paise: s.revenueP,
        orders: s.orders,
        aov_paise: s.aovP,
      },
    });
  }

  static async revenueTrend(req: Request, res: Response) {
    const parsed = revenueTrendQuerySchema.parse(req.query);
    const { repo, dash } = await OwnerAnalyticsController.deps();
    const { fromIso, toIso } = OwnerAnalyticsController.windowFromQuery(dash, parsed);

    const rows = await repo.revenueTrend({
      fromIso, toIso, groupBy: parsed.groupBy, tz: parsed.tz,
      productId: parsed.productId, category: parsed.category,
    });

    return res.json({
      window: { from: fromIso, to: toIso, tz: parsed.tz },
      groupBy: parsed.groupBy,
      points: rows.map(r => ({ bucket: r.bucket, revenue_paise: r.revenueP })),
    });
  }

  static async topProducts(req: Request, res: Response) {
    const parsed = topProductsQuerySchema.parse(req.query);
    const { repo, dash } = await OwnerAnalyticsController.deps();
    const { fromIso, toIso } = OwnerAnalyticsController.windowFromQuery(dash, parsed);

    const items = await repo.topProducts({
      fromIso, toIso, limit: parsed.limit, category: parsed.category,
    });

    return res.json({
      window: { from: fromIso, to: toIso, tz: parsed.tz },
      items: items.map(i => ({
        productId: i.productId,
        title: i.title,
        qty: i.qty,
        revenue_paise: i.revenueP,
      })),
    });
  }

  static async revenueOrders(req: Request, res: Response) {
    const parsed = revenueOrdersQuerySchema.parse(req.query);
    const { repo, dash } = await OwnerAnalyticsController.deps();
    const { fromIso, toIso } = OwnerAnalyticsController.windowFromQuery(dash, parsed);

    const result = await repo.revenueOrders({
      fromIso, toIso,
      page: parsed.page, limit: parsed.limit,
      status: parsed.status, needsShipment: parsed.needsShipment, sort: parsed.sort,
      productId: parsed.productId, category: parsed.category,
    });

    return res.json(result);
  }
}
