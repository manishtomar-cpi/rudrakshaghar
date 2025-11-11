import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors, spacing } from "../../../src/theme";
import { Header } from "../../../src/components/shared/Header";
import { Card } from "../../../src/components/shared/Card";
import { Button } from "../../../src/components/shared/Button";
import { PaymentRow } from "../../../src/components/dashboard/PaymentRow";
import { HistoryFilterBar } from "../../../src/components/filters/HistoryFilterBar";
import {
  listOwnerPayments,
  confirmPayment,
  rejectPayment,
} from "../../../src/features/payments/api";
import type { PaymentStatus } from "../../../src/features/payments/types";
import type { Range } from "../../../src/features/dashboard/range";
import { toQueryParams } from "../../../src/features/dashboard/range";
import { AuthExpiryBanner } from "../../../src/components/shared/AuthExpiryBanner";

const STATUSES: PaymentStatus[] = ["SUBMITTED", "CONFIRMED", "REJECTED"];

export default function PaymentsIndex() {
  const { status: statusFromUrl } = useLocalSearchParams<{ status?: string }>();

  // Filters
  const [status, setStatus] = useState<PaymentStatus>(
    (statusFromUrl as PaymentStatus) || "SUBMITTED"
  );
  const [range, setRange] = useState<Range>({ kind: "7d" });

  // List & pagination
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Derived query params & helpers
  const qp = useMemo(() => toQueryParams(range), [range]);
  const tz = "Asia/Kolkata";
  const idSet = useMemo(() => new Set(items.map((i) => i.orderId)), [items]);

  // Fetch payments (supports reset for pull-to-refresh / filter changes)
  const load = async (reset = false) => {
    try {
      if (reset) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const res = await listOwnerPayments({
        status,
        page: reset ? 1 : page,
        limit: 20,
        range: (qp as any).range,
        from: (qp as any).from,
        to: (qp as any).to,
        tz,
      });

      // Normalize/shape API items for list display and avoid duplicates
      const list = (res?.items ?? [])
        .map((it: any) => ({
          orderId: it.orderId,
          orderNumber: it.orderNumber,
          customerName: it.customerName,
          status: it.status,
          rightLabel: it.dateIso ? new Date(it.dateIso).toDateString() : "—",
          amount: (it.amount ?? 0) / 100,
        }))
        .filter((it: any) => !idSet.has(it.orderId));

      setItems(reset ? list : [...items, ...list]);
      setNextPage(res?.nextPage ?? null);
      setPage(reset ? 2 : page + 1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load + reload on filter changes
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, JSON.stringify(qp)]);

  // Infinite scroll guard
  const onEnd = () => {
    if (!loading && nextPage) load(false);
  };

  // Confirm payment with a simple confirm dialog
  const onConfirm = (orderId: string, orderNumber?: string) => {
    Alert.alert(
      "Confirm payment",
      `Confirm payment for ${orderNumber ?? orderId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await confirmPayment(orderId, {});
            load(true);
          },
        },
      ]
    );
  };

  // Reject payment; use prompt when available, else a confirm-only fallback
  const onReject = (orderId: string, orderNumber?: string) => {
    if (!Alert.prompt) {
      // Android fallback if prompt is unavailable
      Alert.alert("Reject payment", `Reject ${orderNumber ?? orderId}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            await rejectPayment(orderId, "Rejected");
            load(true);
          },
        },
      ]);
      return;
    }
    Alert.prompt?.(
      "Reject payment",
      `Enter reason for ${orderNumber ?? orderId}`,
      async (reason) => {
        if (!reason) return;
        await rejectPayment(orderId, reason);
        load(true);
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Header title="Payments" subtitle="Owner history" />
        <AuthExpiryBanner />
      </View>

      <HistoryFilterBar value={range} onChange={setRange} enableCustom />

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <Card>
          <View style={styles.filters}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.chip, status === s && styles.chipActive]}
              >
                <Text
                  style={[styles.chipTxt, status === s && styles.chipActiveTxt]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.orderId}
        renderItem={({ item }) => (
          <Card
            style={{ marginHorizontal: spacing.lg, marginVertical: spacing.md }}
          >
            <PaymentRow
              orderId={item.orderId}
              orderNumber={item.orderNumber}
              amount={item.amount}
              submittedAt={undefined}
              customer={{ name: item.customerName }}
              onPress={() => {}}
            />

            {status === "SUBMITTED" && (
              <View
                style={{
                  flexDirection: "row",
                  columnGap: spacing.md,
                  marginTop: spacing.md,
                }}
              >
                <Button
                  title="Confirm"
                  onPress={() => onConfirm(item.orderId, item.orderNumber)}
                />
                <Button
                  title="Reject"
                  tone="ghost"
                  onPress={() => onReject(item.orderId, item.orderNumber)}
                />
              </View>
            )}
          </Card>
        )}
        onEndReached={onEnd}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            tintColor={colors.brand.accent}
            refreshing={refreshing}
            onRefresh={() => load(true)}
          />
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
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
  },
  chipActive: { backgroundColor: colors.brand.accent },
  chipTxt: { color: colors.neutral.white, fontWeight: "700" },
  chipActiveTxt: { color: "#1b1b1b" },
});
