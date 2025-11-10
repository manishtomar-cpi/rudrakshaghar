import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { colors, spacing } from "../../../src/theme";
import { Header } from "../../../src/components/shared/Header";
import { Card } from "../../../src/components/shared/Card";
import { formatCurrencyINR, formatRelative } from "../../../src/features/dashboard/transformers";
import { listOwnerOrders } from "../../../src/features/orders/api";
import type { OrderStatus } from "../../../src/features/orders/types";

const STATUS_CHIPS: OrderStatus[] = ["NEW", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELED"];

export default function OrdersIndex() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [needsShipment, setNeedsShipment] = useState<boolean>(false);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (reset = false) => {
    try {
      if (reset) { setRefreshing(true); setPage(1); }
      else setLoading(true);
      const res = await listOwnerOrders({ status, needsShipment, page: reset ? 1 : page, limit: 20 });
      const list = res?.items ?? [];
      setItems(reset ? list : [...items, ...list]);
      setNextPage(res?.nextPage ?? null);
      setPage(reset ? 2 : (page + 1));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, needsShipment]);

  const onEnd = () => { if (!loading && nextPage) load(false); };

  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.lg }}>
        <Header title="Orders" subtitle="Owner view" />
        <Card>
          <View style={styles.filters}>
            <Pressable onPress={() => setNeedsShipment(!needsShipment)} style={[styles.chip, needsShipment && styles.chipActive]}>
              <Text style={[styles.chipTxt, needsShipment && styles.chipActiveTxt]}>Needs shipment</Text>
            </Pressable>
            {STATUS_CHIPS.map((s) => (
              <Pressable key={s} onPress={() => setStatus(s === status ? undefined : s)} style={[styles.chip, status === s && styles.chipActive]}>
                <Text style={[styles.chipTxt, status === s && styles.chipActiveTxt]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.title}>Order {item.id}</Text>
              {!!item.total && <Text style={styles.amount}>{formatCurrencyINR(item.total)}</Text>}
            </View>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>
              {item.customer?.name || item.customer?.phone || "Customer"} · {formatRelative(item.placedAt)}
            </Text>
          </Card>
        )}
        onEndReached={onEnd}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl tintColor={colors.brand.accent} refreshing={refreshing} onRefresh={() => load(true)} />}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  filters: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.sm, rowGap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.brand.accentDark },
  chipActive: { backgroundColor: colors.brand.accent },
  chipTxt: { color: colors.neutral.white, fontWeight: "700" },
  chipActiveTxt: { color: "#1b1b1b" },
  title: { color: colors.neutral.white, fontWeight: "900" },
  amount: { color: colors.brand.accent, fontWeight: "900" },
  meta: { color: colors.neutral.muted, marginTop: 4 },
});
