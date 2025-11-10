import { useEffect, useMemo, useState } from "react";
import { fetchDashboard } from "./api";
import type { DashboardInclude, DashboardRange, DashboardResponse } from "./types";

type UseDashboardOpts = {
  include?: DashboardInclude;
  range?: DashboardRange;
  from?: string;
  to?: string;
  tz?: string;
  limit?: number;
};

export function useDashboard(opts?: UseDashboardOpts) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const key = useMemo(() => JSON.stringify(opts ?? {}), [opts]);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErr(null);
      const d = await fetchDashboard(opts);
      setData(d);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [key]);

  return { data, loading, error: err, refresh: () => load(true), refreshing };
}
