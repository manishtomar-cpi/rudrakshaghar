export type DashboardWindow = { from: string; to: string; tz?: string };

export type DashboardSummary = {
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

export type DashboardQueues = {
  payments: Array<{
    orderId: string;
    amount: number;
    submittedAt: string;
    customer: { name: string | null; phone: string | null } | null;
  }>;
  ordersNeedingShipment: Array<{ orderId: string; status: string; placedAt: string }>;
};

export type DashboardCharts = {
  revenueDaily: Array<{ date: string; amount: number }>;
  ordersDaily: Array<{ date: string; count: number }>;
  topProducts: Array<{ productId: string; title: string; qty: number; revenue: number }>;
};

export type DashboardMeetings = { upcoming: Array<{ id: string; start: string; end: string; customer?: { name?: string | null }; meetLink?: string | null }> };

export type DashboardCatalog = {
  lowOrNoImage: number;
  recentlyUpdated: Array<{ productId: string; title: string; updatedAt: string; active: boolean }>;
};

export type DashboardSettings = { configured: boolean; upiConfigured: boolean; missing: string[] };

export type DashboardResponse = {
  window: DashboardWindow;
  summary: DashboardSummary;
  queues?: DashboardQueues;
  charts?: DashboardCharts;
  meetings?: DashboardMeetings;
  catalog?: DashboardCatalog;
  settings?: DashboardSettings;
};

export type DashboardInclude = Array<"queues" | "charts" | "meetings" | "catalog" | "settings">;
export type DashboardRange = "today" | "7d" | "30d" | "custom";
