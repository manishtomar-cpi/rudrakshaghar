import { useEffect, useMemo, useState } from "react";
import { ScrollView, RefreshControl, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { Header } from "../shared/Header";
import { KpiGrid } from "./KpiGrid";
import { PaymentsQueue } from "./PaymentsQueue";
import { ShipmentQueue } from "./ShipmentQueue";
import { MiniChart } from "./MiniChart";
import { TopProductsList } from "./TopProductsList";
import { SettingsBanner } from "./SettingsBanner";
import { CatalogSignals } from "./CatalogSignals";
import { KpiGridSkeleton, ListSkeleton, ChartSkeleton } from "./Skeletons";

import { api } from "../../api/axios";
import { colors, spacing } from "../../theme";
import { SectionHeader } from "./SectionHeader";
import { formatCount, formatCurrencyINR } from "../../features/dashboard/transformers";

import type { Range } from "../../features/dashboard/range";
import { toQueryParams } from "../../features/dashboard/range";

type DashboardData = {
  window: { tz: string };
  summary?: {
    paymentsToReview: number;
    ordersPlaced: number;
    ordersPaymentSubmitted: number;
    ordersPacked: number;
    ordersShipped: number;
    ordersDelivered: number;
    ordersCanceled: number;
    revenuePaid: number;
  };
  settings?: {
    configured: boolean;
    upiConfigured: boolean;
    missing: string[];
  };
  queues?: {
    payments: Array<{ id: string; orderId: string; amount: number; createdAt: string }>;
    ordersNeedingShipment: Array<{ id: string; orderId: string; customer: string; createdAt: string }>;
  };
  charts?: {
    revenueDaily: Array<{ date: string; amount: number }>;
    ordersDaily: Array<{ date: string; count: number }>;
    topProducts: Array<{ id: string; name: string; qty: number; revenue: number }>;
  };
  catalog?: {
    lowOrNoImage: number;
    recentlyUpdated: number;
  };
};

// helper: safe request (don’t crash the whole dashboard if one section errors)
async function getSafe<T>(url: string, params?: Record<string, any>): Promise<T | null> {
  try {
    const { data } = await api.get<T>(url, params ? { params } : undefined);
    return data;
  } catch (_e) {
    return null;
  }
}

type Props = {
  range: Range;           // ← required (Today / 7d / 30d / 90d / Custom)
  tz?: string;            // optional tz (defaults to 'Asia/Kolkata')
  limit?: number;         // queue size (defaults to 5)
};

export default function DashboardScreen({ range, tz = "Asia/Kolkata", limit = 5 }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  const params = useMemo(() => ({ ...toQueryParams(range), tz, limit }), [range, tz, limit]);
  const depKey = useMemo(() => JSON.stringify(params), [params]);

  const subtitle = useMemo(() => {
    // render a human label for the header
    if (range.kind === "today") return "Today";
    if (range.kind === "7d") return "Last 7 days";
    if (range.kind === "30d") return "Last 30 days";
    if (range.kind === "90d") return "Last 90 days";
    // custom
    return `${range.start} → ${range.end}`;
  }, [range]);

  async function load(initial = false) {
    try {
      initial ? setLoading(true) : setRefreshing(true);

      // Fire requests in parallel. Adjust endpoints to match your API.
      const [
        summary,
        settings,
        paymentsQueue,
        needsShipmentQueue,
        revenueDaily,
        ordersDaily,
        topProducts,
        catalogSignals,
      ] = await Promise.all([
        getSafe<DashboardData["summary"]>("/owner/home/summary", params),
        getSafe<DashboardData["settings"]>("/owner/app-settings/status"),
        getSafe<DashboardData["queues"]["payments"]>("/owner/payments/queue", { ...params, status: "SUBMITTED", limit }),
        getSafe<DashboardData["queues"]["ordersNeedingShipment"]>("/owner/orders/needs-shipment", { ...params, limit }),
        getSafe<Array<{ date: string; amount: number }>>("/owner/home/trends/revenue-daily", params),
        getSafe<Array<{ date: string; count: number }>>("/owner/home/trends/orders-daily", params),
        getSafe<Array<{ id: string; name: string; qty: number; revenue: number }>>("/owner/home/top-products", params),
        getSafe<DashboardData["catalog"]>("/owner/catalog/signals", params),
      ]);

      setData({
        window: { tz },
        summary: summary ?? undefined,
        settings: settings ?? undefined,
        queues: {
          payments: paymentsQueue ?? [],
          ordersNeedingShipment: needsShipmentQueue ?? [],
        },
        charts: {
          revenueDaily: revenueDaily ?? [],
          ordersDaily: ordersDaily ?? [],
          topProducts: topProducts ?? [],
        },
        catalog: catalogSignals ?? undefined,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  const s = data?.summary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, rowGap: spacing.lg }}
      refreshControl={
        <RefreshControl
          tintColor={colors.brand.accent}
          refreshing={refreshing}
          onRefresh={() => load(false)}
        />
      }
    >
      <Header title="Dashboard" subtitle={subtitle} />

      {/* Settings banner */}
      {data?.settings && (
        <SettingsBanner
          configured={data.settings.configured}
          upiConfigured={data.settings.upiConfigured}
          missing={data.settings.missing}
          onPressAction={() => router.push("/(app)/settings")}
        />
      )}

      {/* KPIs */}
      {loading && !data ? (
        <KpiGridSkeleton />
      ) : s ? (
        <KpiGrid
          columns={2}
          items={[
            {
              title: "Payments to review",
              value: s.paymentsToReview,
              tone: "accent",
              onPress: () => router.push("/(app)/payments?status=SUBMITTED"),
            },
            { title: "Orders placed", value: s.ordersPlaced, onPress: () => router.push("/(app)/orders") },
            {
              title: "Payment submitted",
              value: s.ordersPaymentSubmitted,
              onPress: () => router.push("/(app)/orders?status=PAYMENT_SUBMITTED"),
            },
            { title: "Packed", value: s.ordersPacked, onPress: () => router.push("/(app)/orders?status=PACKED") },
            { title: "Shipped", value: s.ordersShipped, onPress: () => router.push("/(app)/orders?status=SHIPPED") },
            {
              title: "Delivered",
              value: s.ordersDelivered,
              tone: "success",
              onPress: () => router.push("/(app)/orders?status=DELIVERED"),
            },
            {
              title: "Canceled",
              value: s.ordersCanceled,
              tone: "danger",
              onPress: () => router.push("/(app)/orders?status=CANCELED"),
            },
            { title: "Revenue", value: formatCurrencyINR(s.revenuePaid) },
          ]}
        />
      ) : null}

      {/* Queues */}
      {loading && !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <PaymentsQueue
            items={data?.queues?.payments ?? []}
            onSeeAll={() => router.push("/(app)/payments?status=SUBMITTED")}
            onRowPress={(orderId) => router.push(`/(app)/orders/${orderId}`)}
          />
          <ShipmentQueue
            items={data?.queues?.ordersNeedingShipment ?? []}
            onSeeAll={() =>
              router.push("/(app)/orders?status=PAYMENT_CONFIRMED,PACKED&needsShipment=true")
            }
            onRowPress={(orderId) => router.push(`/(app)/orders/${orderId}`)}
          />
        </>
      )}

      {/* Charts */}
      {loading && !data ? (
        <ChartSkeleton />
      ) : (
        <View style={{ rowGap: spacing.md }}>
          <View style={styles.card}>
            <SectionHeader title="Trends" subtitle="Daily buckets" />
            <View style={{ rowGap: spacing.md }}>
              <MiniChart
                title="Revenue"
                points={(data?.charts?.revenueDaily ?? []).map((p, i) => ({ x: i, y: p.amount }))}
                summary={formatCurrencyINR(
                  (data?.charts?.revenueDaily ?? []).reduce((a, b) => a + b.amount, 0)
                )}
                hint="daily"
              />
              <MiniChart
                title="Orders"
                points={(data?.charts?.ordersDaily ?? []).map((p, i) => ({ x: i, y: p.count }))}
                summary={`${(data?.charts?.ordersDaily ?? []).reduce((a, b) => a + b.count, 0)}`}
                hint="daily"
              />
            </View>
          </View>

          <TopProductsList
            items={data?.charts?.topProducts ?? []}
            onItemPress={(id) => router.push(`/(app)/catalog?highlight=${id}`)}
          />
        </View>
      )}

      {/* Catalog signals */}
      {data?.catalog && (
        <CatalogSignals
          lowOrNoImage={data.catalog.lowOrNoImage}
          recent={data.catalog.recentlyUpdated}
          onFixNow={() => router.push("/(app)/catalog?filter=no-image")}
          onOpenCatalog={() => router.push("/(app)/catalog")}
        />
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
