import { api } from "../../api/axios";
import type { DashboardResponse, DashboardInclude, DashboardRange } from "./types";

export async function fetchDashboard(params?: {
  include?: DashboardInclude;
  range?: DashboardRange;
  from?: string;
  to?: string;
  tz?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.include?.length) qs.set("include", params.include.join(","));
  if (params?.range) qs.set("range", params.range);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.tz) qs.set("tz", params.tz);
  if (params?.limit) qs.set("limit", String(params.limit));

  const { data } = await api.get<DashboardResponse>(`/owner/dashboard${qs.size ? `?${qs.toString()}` : ""}`);
  return data;
}
