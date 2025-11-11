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

/**
 * Dashboard data hook: fetches summary/queues/charts with loading & refresh states.
 */
export function useDashboard(opts?: UseDashboardOpts) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Re-run when options change
  const key = useMemo(() => JSON.stringify(opts ?? {}), [opts]);

  // Fetch data; when called with isRefresh, toggles pull-to-refresh state
  const load = async (isRefresh = false, signal?: AbortSignal) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErr(null);

      const d = await fetchDashboard(opts, signal);

      // Ignore if request was aborted
      if (signal?.aborted) return;
      setData(d);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.message === "canceled") return;

      const msg =
        e?.response?.data?.error?.message ||
        e?.message ||
        "Failed to load dashboard";
      setErr(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(false, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, error: err, refresh: () => load(true), refreshing };
}
