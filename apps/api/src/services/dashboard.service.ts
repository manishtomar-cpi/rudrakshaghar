import type { Client } from "pg";
import { DateTime } from "luxon";
import { AppSettingsRepo } from "../repositories/appSettings.repo";
import { DashboardRepo } from "../repositories/dashboard.repo";
import { DashboardQueryDto, DashboardResponse } from "../validators/dashboard.schema";

export class DashboardService {
  private dash: DashboardRepo;

  constructor(private db: Client) {
    this.dash = new DashboardRepo(db);
  }

  computeWindow(q: DashboardQueryDto): { fromIso: string; toIso: string; tz?: string } {
    const tz = q.tz;
    const now = tz ? DateTime.now().setZone(tz) : DateTime.now();

    let from: DateTime;
    let to: DateTime;

    switch (q.range) {
      case "today": {
        const start = now.startOf("day");
        const end = start.plus({ days: 1 });
        from = start; to = end;
        break;
      }
      case "7d": {
        const end = (tz ? DateTime.now().setZone(tz) : DateTime.now()).endOf("day").plus({ seconds: 1 });
        const start = end.minus({ days: 7 }).startOf("day");
        from = start; to = end;
        break;
      }
      case "30d": {
        const end = (tz ? DateTime.now().setZone(tz) : DateTime.now()).endOf("day").plus({ seconds: 1 });
        const start = end.minus({ days: 30 }).startOf("day");
        from = start; to = end;
        break;
      }
      case "custom": {
        const f = tz ? DateTime.fromISO(q.from!, { zone: tz }) : DateTime.fromISO(q.from!);
        const t = tz ? DateTime.fromISO(q.to!, { zone: tz }) : DateTime.fromISO(q.to!);
        from = f; to = t;
        break;
      }
    }

    return { fromIso: from.toUTC().toISO()!, toIso: to.toUTC().toISO()!, tz };
  }

  async getResponse(q: DashboardQueryDto): Promise<DashboardResponse> {
    const { fromIso, toIso, tz } = this.computeWindow(q);
    const summary = await this.getSummary({ fromIso, toIso });

    const out: DashboardResponse = {
      window: { from: fromIso, to: toIso, tz },
      summary,
    };

    if (q.include?.has("queues")) {
      out.queues = await this.getQueues(q.limit);
    }
    if (q.include?.has("charts")) {
      out.charts = await this.getCharts({ fromIso, toIso, tz });
    }
    if (q.include?.has("settings")) {
      out.settings = await this.getSettingsSignal();
    }
    if (q.include?.has("catalog")) {
      out.catalog = await this.getCatalogSignals(q.limit);
    }
    if (q.include?.has("meetings")) {
      out.meetings = { upcoming: [] }; // placeholder until meetings repo lands
    }

    return out;
  }

  // ------- Phase 1 -------
  private async getSummary(args: { fromIso: string; toIso: string }) {
    const { fromIso, toIso } = args;

    const [
      paymentsToReview,
      statusMap,
      revenuePaid,
      ordersPlaced,
      productsCount,
    ] = await Promise.all([
      this.dash.countPaymentsSubmitted(),
      this.dash.countOrdersByStatusInWindow(fromIso, toIso),
      this.dash.sumConfirmedPaymentsInWindow(fromIso, toIso),
      this.dash.countOrdersPlacedInWindow(fromIso, toIso),
      this.dash.productCounts(),
    ]);

    return {
      paymentsToReview,
      ordersNew: statusMap.get("NEW") ?? 0,
      ordersPaymentSubmitted: statusMap.get("PAYMENT_SUBMITTED") ?? 0,
      ordersPacked: statusMap.get("PACKED") ?? 0,
      ordersShipped: statusMap.get("SHIPPED") ?? 0,
      ordersDelivered: statusMap.get("DELIVERED") ?? 0,
      ordersCanceled: statusMap.get("CANCELED") ?? 0,
      revenuePaid,
      ordersPlaced,
      activeProducts: productsCount.active,
      inactiveProducts: productsCount.inactive,
    };
  }

  private async getQueues(limit: number) {
    const [payments, ordersNeedingShipment] = await Promise.all([
      this.dash.listSubmittedPayments(limit),
      this.dash.listOrdersNeedingShipment(limit),
    ]);
    return { payments, ordersNeedingShipment };
  }

  // ------- Phase 2 -------
  private async getCharts(args: { fromIso: string; toIso: string; tz?: string }) {
    const { fromIso, toIso, tz } = args;
    const [revenueDaily, ordersDaily, topProducts] = await Promise.all([
      this.dash.revenueDaily(fromIso, toIso, tz),
      this.dash.ordersDaily(fromIso, toIso, tz),
      this.dash.topProducts(fromIso, toIso),
    ]);
    return { revenueDaily, ordersDaily, topProducts };
  }

  // ------- Phase 3 -------
  private async getSettingsSignal() {
    const s = await AppSettingsRepo.getOwner();
    const configured = !!s;
    const upiConfigured = !!(s?.upi_vpa);
    const missing: string[] = [];

    if (configured) {
      if (!s.logo_url) missing.push("logoUrl");
      if (!s.return_address) missing.push("returnAddress");
      if (!s.privacy_url) missing.push("privacyUrl");
      if (!s.terms_url) missing.push("termsUrl");
      if (!s.return_policy_url) missing.push("returnPolicyUrl");
    }

    return { configured, upiConfigured, missing };
  }

  private async getCatalogSignals(limit: number) {
    const [lowOrNoImage, recentlyUpdated] = await Promise.all([
      this.dash.countActiveProductsWithNoPrimaryImage(),
      this.dash.listRecentlyUpdatedProducts(limit),
    ]);
    return { lowOrNoImage, recentlyUpdated };
  }
}
