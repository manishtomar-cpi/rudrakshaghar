import { useMemo, useState } from "react";
import { ScrollView, RefreshControl, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { Header } from "../shared/Header";
import { KpiGrid } from "./KpiGrid";
import { PaymentsQueue } from "./PaymentsQueue";
import { ShipmentQueue } from "./ShipmentQueue";
import { MiniChart } from "./MiniChart";
import { TopProductsList } from "./TopProductsList";
import { SettingsBanner } from "./SettingsBanner";
import { KpiGridSkeleton, ListSkeleton, ChartSkeleton } from "./Skeletons";
import { ErrorBanner } from "../shared/ErrorBanner";
import { AuthExpiryBanner } from "../shared/AuthExpiryBanner";

import { colors, spacing } from "../../theme";
import { formatCurrencyINR } from "../../features/dashboard/transformers";

import type { Range } from "../../features/dashboard/range";
import { toQueryParams, labelFor } from "../../features/dashboard/range";
import { useDashboard } from "../../features/dashboard/hooks";
import type { DashboardResponse } from "../../features/dashboard/types";
import { Card } from "../shared/Card";
import { HistoryFilterBar } from "../filters/HistoryFilterBar";

type Props = {
  range?: Range;
  tz?: string;
  limit?: number;
};

export default function DashboardScreen({
  range: initialRange = { kind: "7d" },
  tz = "Asia/Kolkata",
  limit = 5,
}: Props) {
  const router = useRouter();

  // Dashboard window (adjustable via filter bar)
  const [range, setRange] = useState<Range>(initialRange);
  const qp = useMemo(() => toQueryParams(range), [range]);

  // Fetch dashboard data for queues, charts, catalog, and settings
  const { data, loading, refreshing, refresh, error } = useDashboard({
    include: ["queues", "charts", "catalog", "settings"],
    range: (qp as any).range,
    from: (qp as any).from,
    to: (qp as any).to,
    tz,
    limit,
  });

  const summary: DashboardResponse["summary"] | undefined = data?.summary;

  // Map to UI-friendly shapes/units
  const paymentsQueueForUi = (data?.queues?.payments ?? []).map((p) => ({
    ...p,
    amount: (p.amount ?? 0) / 100,
  }));

  const revenueDailyPoints = (data?.charts?.revenueDaily ?? []).map((p, i) => ({
    x: i,
    y: (p.amount ?? 0) / 100,
  }));

  const revenueDailyTotalRupees =
    (data?.charts?.revenueDaily ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0) / 100;

  const topProductsForUi = (data?.charts?.topProducts ?? []).map((tp) => ({
    ...tp,
    revenue: (tp.revenue ?? 0) / 100,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, rowGap: spacing.lg }}
      refreshControl={
        <RefreshControl
          tintColor={colors.brand.accent}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      }
    >
      <Header title="Dashboard" subtitle={labelFor(range)} />
      <AuthExpiryBanner />
      {!!error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* Date-range filter */}
      <Card>
        <HistoryFilterBar value={range} onChange={setRange} enableCustom />
      </Card>

      {/* Settings nudges */}
      {data?.settings && (
        <SettingsBanner
          configured={data.settings.configured}
          upiConfigured={data.settings.upiConfigured}
          missing={data.settings.missing}
          onPressAction={() => router.push("/(app)/settings")}
        />
      )}

      {/* KPI grid */}
      {loading && !data ? (
        <KpiGridSkeleton />
      ) : summary ? (
        <KpiGrid
          horizontal
          itemWidth={170}
          gap={spacing.md}
          items={[
            {
              title: "Payments to review",
              value: summary.paymentsToReview,
              tone: "accent",
              onPress: () => router.push("/(app)/payments?status=SUBMITTED"),
            },
            {
              title: "Orders placed",
              value: summary.ordersPlaced,
              onPress: () => router.push("/(app)/orders"),
            },
            {
              title: "Payment submitted",
              value: summary.ordersPaymentSubmitted,
              onPress: () =>
                router.push("/(app)/orders?status=PAYMENT_SUBMITTED"),
            },
            {
              title: "Packed",
              value: summary.ordersPacked,
              onPress: () => router.push("/(app)/orders?status=PACKED"),
            },
            {
              title: "Shipped",
              value: summary.ordersShipped,
              onPress: () => router.push("/(app)/orders?status=SHIPPED"),
            },
            {
              title: "Delivered",
              value: summary.ordersDelivered,
              tone: "success",
              onPress: () => router.push("/(app)/orders?status=DELIVERED"),
            },
            {
              title: "Cancelled",
              value: summary.ordersCanceled,
              tone: "danger",
              onPress: () => router.push("/(app)/orders?status=CANCELLED"),
            },
            {
              title: "Revenue",
              value: formatCurrencyINR((summary.revenuePaid ?? 0) / 100),
              onPress: () => router.push("/(app)/revenue"),
            },
          ]}
        />
      ) : null}

      {/* Queues */}
      {loading && !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <PaymentsQueue
            items={paymentsQueueForUi}
            onSeeAll={() => router.push("/(app)/payments?status=SUBMITTED")}
            onRowPress={(orderId) => router.push(`/(app)/orders/${orderId}`)}
          />
          <ShipmentQueue
            items={data?.queues?.ordersNeedingShipment ?? []}
            onSeeAll={() => router.push("/(app)/orders?needsShipment=true")}
            onRowPress={(orderId) => router.push(`/(app)/orders/${orderId}`)}
          />
        </>
      )}

      {/* Charts + Top products */}
      {loading && !data ? (
        <ChartSkeleton />
      ) : (
        <View style={{ rowGap: spacing.md }}>
          <View style={styles.card}>
            <View style={{ rowGap: spacing.md }}>
              <MiniChart
                title="Revenue"
                points={revenueDailyPoints}
                summary={formatCurrencyINR(revenueDailyTotalRupees)}
                hint="daily"
              />
              <MiniChart
                title="Orders"
                points={(data?.charts?.ordersDaily ?? []).map((p, i) => ({
                  x: i,
                  y: p.count,
                }))}
                summary={`${(data?.charts?.ordersDaily ?? []).reduce(
                  (a, b) => a + b.count,
                  0
                )}`}
                hint="daily"
              />
            </View>
          </View>

          <TopProductsList
            items={topProductsForUi}
            onItemPress={(id) => router.push(`/(app)/catalog?highlight=${id}`)}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  card: {
    backgroundColor: colors.neutral.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
    padding: spacing.lg,
  },
});
