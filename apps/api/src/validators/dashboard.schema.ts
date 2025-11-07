import { z } from "zod";

export const DashboardRangeEnum = z.enum(["today", "7d", "30d", "custom"]);

export const DashboardIncludeFlags = z.enum([
  "queues",
  "charts",
  "meetings",
  "catalog",
  "settings",
]);

export const DashboardQuerySchema = z.object({
  range: DashboardRangeEnum.default("7d"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  tz: z.string().optional(),
  include: z
    .string()
    .optional()
    .transform((s) =>
      new Set(
        (s ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      ) as Set<z.infer<typeof DashboardIncludeFlags>>
    ),
  limit: z.preprocess(
    (v) => (v === undefined ? 5 : Number(v)),
    z.number().int().min(1).max(20)
  ),
}).superRefine((val, ctx) => {
  if (val.range === "custom") {
    if (!val.from) ctx.addIssue({ code: "custom", message: "`from` required for custom range" });
    if (!val.to) ctx.addIssue({ code: "custom", message: "`to` required for custom range" });
  }
});

export type DashboardQueryDto = z.infer<typeof DashboardQuerySchema>;

export type DashboardResponse = {
  window: { from: string; to: string; tz?: string };
  summary: {
    paymentsToReview: number;
    ordersNew: number;
    ordersPaymentSubmitted: number;
    ordersPacked: number;
    ordersShipped: number;
    ordersDelivered: number;
    ordersCanceled: number;
    revenuePaid: number;
    ordersPlaced: number;
    activeProducts: number;
    inactiveProducts: number;
  };
  queues?: {
    payments: Array<{
      orderId: string;
      amount: number;
      submittedAt: string;
      customer: { name: string | null; phone: string | null } | null;
    }>;
    ordersNeedingShipment: Array<{ orderId: string; status: string; placedAt: string }>;
  };
  charts?: {
    revenueDaily: Array<{ date: string; amount: number }>;
    ordersDaily: Array<{ date: string; count: number }>;
    topProducts: Array<{ productId: string; title: string; qty: number; revenue: number }>;
  };
  meetings?: { upcoming: Array<{ id: string; start: string; end: string; customer?: { name?: string | null }; meetLink?: string | null }>; };
  catalog?: { lowOrNoImage: number; recentlyUpdated: Array<{ productId: string; title: string; updatedAt: string; active: boolean }>; };
  settings?: { configured: boolean; upiConfigured: boolean; missing: string[]; };
};
