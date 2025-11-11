// apps/mobile/src/features/dashboard/api.ts
import { api } from "../../api/axios";
import type { DashboardResponse, DashboardInclude, DashboardRange } from "./types";

/** Build clean query params for dashboard requests */
function buildParams(params?: {
  include?: DashboardInclude;
  range?: DashboardRange;
  from?: string;
  to?: string;
  tz?: string;
  limit?: number;
}) {
  const q: Record<string, any> = {};

  if (params?.include?.length) q.include = params.include.join(",");
  if (params?.range) q.range = params.range;
  if (params?.from) q.from = params.from;
  if (params?.to) q.to = params.to;
  if (params?.tz) q.tz = params.tz;
  if (typeof params?.limit === "number") q.limit = String(params.limit);

  return q;
}

/** Fetch dashboard data (summary, queues, charts, etc.) */
export async function fetchDashboard(
  params?: {
    include?: DashboardInclude;
    range?: DashboardRange;
    from?: string;
    to?: string;
    tz?: string;
    limit?: number;
  },
  signal?: AbortSignal
) {
  const query = buildParams(params);

  const { data } = await api.get<DashboardResponse>("/owner/dashboard", {
    params: query,
    signal,
  });

  return data;
}
