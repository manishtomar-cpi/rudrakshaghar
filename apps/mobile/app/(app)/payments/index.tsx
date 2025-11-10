import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Alert } from "react-native";
import { colors, spacing } from "../../../src/theme";
import { Header } from "../../../src/components/shared/Header";
import { Card } from "../../../src/components/shared/Card";
import { Button } from "../../../src/components/shared/Button";
import { PaymentRow } from "../../../src/components/dashboard/PaymentRow";
import { listOwnerPayments, confirmPayment, rejectPayment } from "../../../src/features/payments/api";
import type { PaymentStatus } from "../../../src/features/payments/types";

const STATUSES: PaymentStatus[] = ["SUBMITTED", "CONFIRMED", "REJECTED"];

export default function PaymentsIndex() {
  const [status, setStatus] = useState<PaymentStatus>("SUBMITTED");
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (reset = false) => {
    try {
      if (reset) { setRefreshing(true); setPage(1); }
      else setLoading(true);
      const res = await listOwnerPayments({ status, page: reset ? 1 : page, limit: 20 });
      const list = res?.items ?? [];
      setItems(reset ? list : [...items, ...list]);
      setNextPage(res?.nextPage ?? null);
      setPage(reset ? 2 : (page + 1));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  const onEnd = () => { if (!loading && nextPage) load(false); };

  const onConfirm = (orderId: string) => {
    Alert.alert("Confirm payment", `Confirm payment for ${orderId}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: async () => { await confirmPayment(orderId, {}); load(true); } },
    ]);
  };

  const onReject = (orderId: string) => {
    Alert.prompt?.("Reject payment", "Enter reason", async (reason) => {
      if (!reason) return;
      await rejectPayment(orderId, reason);
      load(true);
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.lg }}>
        <Header title="Payments" subtitle="Owner queue" />
        <Card>
          <View style={styles.filters}>
            {STATUSES.map((s) => (
              <Pressable key={s} onPress={() => setStatus(s)} style={[styles.chip, status === s && styles.chipActive]}>
                <Text style={[styles.chipTxt, status === s && styles.chipActiveTxt]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.orderId}
        renderItem={({ item }) => (
          <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <PaymentRow {...item} />
            {status === "SUBMITTED" && (
              <View style={{ flexDirection: "row", columnGap: spacing.md, marginTop: spacing.md }}>
                <Button title="Confirm" onPress={() => onConfirm(item.orderId)} />
                <Button title="Reject" tone="ghost" onPress={() => onReject(item.orderId)} />
              </View>
            )}
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
});
