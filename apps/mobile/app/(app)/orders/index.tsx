import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing } from "../../../src/theme";
import { Header } from "../../../src/components/shared/Header";
import { Card } from "../../../src/components/shared/Card";
import { HistoryFilterBar } from "../../../src/components/filters/HistoryFilterBar";
import {
  formatCurrencyINR,
  formatRelative,
} from "../../../src/features/dashboard/transformers";
import { listOwnerOrders } from "../../../src/features/orders/api";
import type { OrderStatus } from "../../../src/features/orders/types";
import type { Range } from "../../../src/features/dashboard/range";
import { AuthExpiryBanner } from "../../../src/components/shared/AuthExpiryBanner";

const STATUS_CHIPS: OrderStatus[] = [
  "PLACED",
  "PAYMENT_SUBMITTED",
  "PAYMENT_CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function OrdersIndex() {
  const router = useRouter();

  // Filter state
  const [range, setRange] = useState<Range>({ kind: "30d" });
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [needsShipment, setNeedsShipment] = useState<boolean>(false);

  // List + pagination state
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build window params for API from selected range
  const windowParams = useMemo(() => {
    if (range.kind === "custom") {
      const r: any = range as any;
      return {
        range: "custom" as const,
        from: r.start,
        to: r.end,
        tz: "Asia/Kolkata",
      };
    }
    // Pass relative window kind directly (today | 7d | 30d | 90d)
    return {
      range: range.kind as "today" | "7d" | "30d" | "90d",
      tz: "Asia/Kolkata",
    };
  }, [range]);

  // Fetch orders (supports reset for pull-to-refresh / filter changes)
  const load = async (reset = false) => {
    try {
      setError(null);
      if (reset) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const res = await listOwnerOrders({
        ...(windowParams as any),
        page: reset ? 1 : page,
        limit: 20,
        status,
        // Only include needsShipment flag when true (absence = false on backend)
        ...(needsShipment ? { needsShipment: true } : {}),
      });

      const next = res?.items ?? [];
      setItems(reset ? next : [...items, ...next]);
      setNextPage(res?.nextPage ?? null);
      setPage(reset ? 2 : page + 1);
    } catch (e: any) {
      setError(
        e?.response?.data?.error?.message ||
          e?.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load + re-run when filters change
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, needsShipment, windowParams]);

  // Infinite scroll guard: load next page only when not loading and more pages exist
  const onEndReached = () => {
    if (!loading && nextPage) load(false);
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.lg }}>
        <Header title="Orders" subtitle="Owner view" />
        <AuthExpiryBanner />

        <Card>
          <Text style={styles.sub}>Window</Text>
          <HistoryFilterBar value={range} onChange={setRange} enableCustom />

          {/* Status & utility filters */}
          <View style={styles.filters}>
            <Pressable
              onPress={() => setNeedsShipment(!needsShipment)}
              style={[styles.chip, needsShipment && styles.chipActive]}
            >
              <Text
                style={[styles.chipTxt, needsShipment && styles.chipActiveTxt]}
              >
                Needs shipment
              </Text>
            </Pressable>

            {STATUS_CHIPS.map((s) => {
              const active = status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(active ? undefined : s)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipTxt, active && styles.chipActiveTxt]}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/orders/${item.id}`)}>
            <Card
              style={{
                marginHorizontal: spacing.lg,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.title}>
                  {`Order ${
                    item.order_number ?? `#${String(item.id).slice(0, 8)}`
                  }`}
                </Text>

                <Text style={styles.amount}>
                  {formatCurrencyINR(item.total ?? 0)}
                </Text>
              </View>
              <Text style={styles.meta}>Status: {item.status}</Text>
              <Text style={styles.meta}>
                {(item.customer?.name || item.customer?.phone || "Customer") +
                  " · " +
                  formatRelative(item.placed_at ?? item.created_at)}
              </Text>
            </Card>
          </Pressable>
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            tintColor={colors.brand.accent}
            refreshing={refreshing}
            onRefresh={() => load(true)}
          />
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Loading…</Text>
          ) : error ? (
            <Text style={styles.empty}>{error}</Text>
          ) : (
            <Text style={styles.empty}>No orders found for this window.</Text>
          )
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  sub: { color: colors.neutral.muted, marginBottom: spacing.sm },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.sm,
    rowGap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
    backgroundColor: "#0f2a11",
  },
  chipActive: { backgroundColor: colors.brand.accent },
  chipTxt: { color: colors.neutral.white, fontWeight: "700" },
  chipActiveTxt: { color: "#1b1b1b" },
  title: { color: colors.neutral.white, fontWeight: "900" },
  amount: { color: colors.brand.accent, fontWeight: "900" },
  meta: { color: colors.neutral.muted, marginTop: 4 },
  empty: {
    color: colors.neutral.muted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
