import { api } from "../../api/axios";

export async function fetchRevenueSummary(params: {
  range?: "today"|"7d"|"30d"|"custom";
  tz?: string;
  from?: string; to?: string;
  productId?: string;
  category?: "RUDRAKSHA"|"GEMSTONE"|"ACCESSORY";
}) {
  const qs = new URLSearchParams();
  if (params.range) qs.set("range", params.range);
  if (params.tz) qs.set("tz", params.tz);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.productId) qs.set("productId", params.productId);
  if (params.category) qs.set("category", params.category);
  const { data } = await api.get(`/owner/analytics/revenue/summary?${qs.toString()}`);
  return data as { window: any; kpis: { revenue_paise: number; orders: number; aov_paise: number } };
}

export async function fetchRevenueTrend(params: {
  range?: "today"|"7d"|"30d"|"custom";
  tz?: string;
  from?: string; to?: string;
  productId?: string;
  category?: "RUDRAKSHA"|"GEMSTONE"|"ACCESSORY";
  groupBy?: "day"|"week"|"month";
}) {
  const qs = new URLSearchParams();
  if (params.range) qs.set("range", params.range);
  if (params.tz) qs.set("tz", params.tz);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.productId) qs.set("productId", params.productId);
  if (params.category) qs.set("category", params.category);
  qs.set("groupBy", params.groupBy ?? "day");
  const { data } = await api.get(`/owner/analytics/revenue/trend?${qs.toString()}`);
  return data as { window: any; groupBy: string; points: Array<{ bucket: string; revenue_paise: number }> };
}

export async function fetchTopProducts(params: {
  range?: "today"|"7d"|"30d"|"custom";
  tz?: string;
  from?: string; to?: string;
  category?: "RUDRAKSHA"|"GEMSTONE"|"ACCESSORY";
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.range) qs.set("range", params.range);
  if (params.tz) qs.set("tz", params.tz);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.category) qs.set("category", params.category);
  if (params.limit) qs.set("limit", String(params.limit));
  const { data } = await api.get(`/owner/analytics/top-products?${qs.toString()}`);
  return data as { items: Array<{ productId: string; title: string; qty: number; revenue_paise: number }> };
}

export async function fetchRevenueOrders(params: {
  range?: "today"|"7d"|"30d"|"custom";
  tz?: string;
  from?: string; to?: string;
  productId?: string;
  category?: "RUDRAKSHA"|"GEMSTONE"|"ACCESSORY";
  page?: number; limit?: number;
  status?: "PLACED"|"PAYMENT_SUBMITTED"|"PAYMENT_CONFIRMED"|"PACKED"|"SHIPPED"|"DELIVERED"|"CANCELLED";
  needsShipment?: boolean;
  sort?: "created_at"|"-created_at"|"order_number";
}) {
  const qs = new URLSearchParams();
  if (params.range) qs.set("range", params.range);
  if (params.tz) qs.set("tz", params.tz);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.productId) qs.set("productId", params.productId);
  if (params.category) qs.set("category", params.category);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.needsShipment) qs.set("needsShipment", "true");
  if (params.sort) qs.set("sort", params.sort);
  const { data } = await api.get(`/owner/analytics/revenue/orders?${qs.toString()}`);
  return data as { items: Array<any>; page: number; pageSize: number; total: number };
}
