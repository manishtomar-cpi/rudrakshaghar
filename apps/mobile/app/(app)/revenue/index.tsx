import { useEffect, useMemo, useState } from "react";
import { View, FlatList, RefreshControl, StyleSheet, Text } from "react-native";
import { colors, spacing } from "../../../src/theme";
import { Header } from "../../../src/components/shared/Header";
import { Card } from "../../../src/components/shared/Card";
import { MiniChart } from "../../../src/components/dashboard/MiniChart";
import { TopProductsList } from "../../../src/components/dashboard/TopProductsList";
import { HistoryFilterBar } from "../../../src/components/filters/HistoryFilterBar";
import { formatCurrencyINR } from "../../../src/features/dashboard/transformers";
import { toQueryParams, type Range } from "../../../src/features/dashboard/range";
import { useDashboard } from "../../../src/features/dashboard/hooks";
import { listOwnerOrders } from "../../../src/features/orders/api";
import { AuthExpiryBanner } from "../../../src/components/shared/AuthExpiryBanner";

export default function RevenueIndex() {
  // Range filter (default last 30 days)
  const [range, setRange] = useState<Range>({ kind: "30d" });
  const tz = "Asia/Kolkata";
  const qp = useMemo(() => toQueryParams(range), [range]);

  // Dashboard summary (charts + settings)
  const { data, loading, refreshing, refresh } = useDashboard({
    include: ["charts", "settings"],
    range: (qp as any).range,
    from: (qp as any).from,
    to: (qp as any).to,
    tz,
    limit: 5,
  });

  // Paginated confirmed orders list for the selected window
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  // Prevent duplicates when appending pages
  const idSet = useMemo(() => new Set(orders.map((o) => o.id ?? o.orderId)), [orders]);

  // Fetch confirmed orders (supports reset for pull-to-refresh / window change)
  async function loadOrders(reset = false) {
    try {
      setLoadingList(true);
      const res = await listOwnerOrders({
        payment_status: "CONFIRMED",
        page: reset ? 1 : page,
        limit: 20,
        range: (qp as any).range,
        from: (qp as any).from,
        to: (qp as any).to,
        tz,
      } as any);

      const list = (res?.items ?? []).filter(
        (it: any) => !idSet.has(it.id ?? it.orderId)
      );

      setOrders(reset ? list : [...orders, ...list]);
      setNextPage(res?.nextPage ?? null);
      setPage(reset ? 2 : page + 1);
    } finally {
      setLoadingList(false);
    }
  }

  // Reload orders when the query params change
  useEffect(() => {
    loadOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(qp)]);

  // KPIs derived from charts
  const revenueTotalRupees =
    (data?.charts?.revenueDaily ?? []).reduce((a, b) => a + (b.amount || 0), 0) /
    100;
  const ordersCount = (data?.charts?.ordersDaily ?? []).reduce(
    (a, b) => a + (b.count || 0),
    0
  );
  const aov = ordersCount ? Math.round(revenueTotalRupees / ordersCount) : 0;

  return (
    <FlatList
      data={orders}
      keyExtractor={(it) => it.id ?? it.orderId ?? String(Math.random())}
      renderItem={({ item }) => (
        <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Text style={styles.rowTitle}>
            Order {item.order_number ?? item.id}
          </Text>
          <Text style={styles.rowMeta}>
            {item.customer?.name || item.customer?.phone || "Anonymous"}
          </Text>
          {!!item.total && (
            <Text style={styles.rowAmt}>{formatCurrencyINR(item.total)}</Text>
          )}
        </Card>
      )}
      onEndReached={() => {
        if (!loadingList && nextPage) loadOrders(false);
      }}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <View style={{ padding: spacing.lg, rowGap: spacing.lg }}>
          <Header title="Revenue" subtitle="Owner analytics" />
          <AuthExpiryBanner />

          {/* Date range selector */}
          <Card>
            <HistoryFilterBar value={range} onChange={setRange} enableCustom />
          </Card>

          {/* KPI cards */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card style={styles.kpi}>
              <Text style={styles.kpiLabel}>Revenue</Text>
              <Text style={styles.kpiVal}>
                {formatCurrencyINR(revenueTotalRupees)}
              </Text>
            </Card>
            <Card style={styles.kpi}>
              <Text style={styles.kpiLabel}>Orders</Text>
              <Text style={styles.kpiVal}>{ordersCount}</Text>
            </Card>
            <Card style={styles.kpi}>
              <Text style={styles.kpiLabel}>AOV</Text>
              <Text style={styles.kpiVal}>{formatCurrencyINR(aov)}</Text>
            </Card>
          </View>

          {/* Revenue time series */}
          <Card>
            <Text style={styles.sectionTitle}>Revenue over time</Text>
            <MiniChart
              title=""
              points={(data?.charts?.revenueDaily ?? []).map((p, i) => ({
                x: i,
                y: (p.amount ?? 0) / 100,
              }))}
              summary={formatCurrencyINR(revenueTotalRupees)}
              hint="day"
            />
          </Card>
        </View>
      }
      refreshControl={
        <RefreshControl
          tintColor={colors.brand.accent}
          refreshing={refreshing || loadingList}
          onRefresh={() => {
            refresh();
            loadOrders(true);
          }}
        />
      }
      contentContainerStyle={{ paddingBottom: 48 }}
      style={{ backgroundColor: colors.neutral.background }}
    />
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.neutral.white,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  kpi: { flex: 1, alignItems: "center", gap: 6 },
  kpiLabel: { color: colors.neutral.muted, fontSize: 12 },
  kpiVal: { color: colors.brand.accent, fontWeight: "900" },
  rowTitle: { color: colors.neutral.white, fontWeight: "800" },
  rowMeta: { color: colors.neutral.muted, marginTop: 2 },
  rowAmt: { color: colors.brand.accent, fontWeight: "900", marginTop: spacing.sm },
});
