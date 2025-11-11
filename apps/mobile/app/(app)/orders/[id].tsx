// apps/mobile/app/(app)/orders/[id].tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, spacing } from "../../../src/theme";
import { Header } from "../../../src/components/shared/Header";
import { Card } from "../../../src/components/shared/Card";
import { Button } from "../../../src/components/shared/Button";
import { ErrorBanner } from "../../../src/components/shared/ErrorBanner";
import { KeyValue } from "../../../src/components/shared/KeyValue";
import {
  formatCurrencyINR,
  formatRelative,
} from "../../../src/features/dashboard/transformers";
import type {
  OwnerOrderDetail,
  OrderStatus,
} from "../../../src/features/orders/types";
import {
  getOwnerOrder,
  patchOwnerOrderStatus,
  createOwnerShipment,
  markOwnerOrderDelivered,
} from "../../../src/features/orders/api";

// Only the two manual transitions supported by backend PATCH
type NextManualStatus = Extract<OrderStatus, "PACKED" | "CANCELLED">;

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<OwnerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shipOpen, setShipOpen] = useState(false);
  const [shipProvider, setShipProvider] = useState("");
  const [shipAwb, setShipAwb] = useState("");
  const [shipNotes, setShipNotes] = useState("");

  const canPack = data?.status === "PAYMENT_CONFIRMED";
  const canShip = data?.status === "PACKED";
  const canDeliver = data?.status === "SHIPPED";
  const canCancel = [
    "PLACED",
    "PAYMENT_SUBMITTED",
    "PAYMENT_CONFIRMED",
    "PACKED",
  ].includes((data?.status ?? "") as string);

  const load = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await getOwnerOrder(id!);
      setData(res);
    } catch (e: any) {
      setError(
        e?.response?.data?.error?.message ||
          e?.message ||
          "Failed to load order"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false); /* eslint-disable-next-line */
  }, [id]);

  // Narrow the allowed transitions for this button:
  const doStatus = async (
    next: Extract<OrderStatus, "PACKED" | "CANCELLED">
  ) => {
    try {
      await patchOwnerOrderStatus(id!, next);
      await load(false);
    } catch (e: any) {
      Alert.alert(
        "Action failed",
        e?.response?.data?.error?.message || e?.message || "Please retry"
      );
    }
  };

  const doShip = async () => {
    if (!shipProvider || !shipAwb) {
      Alert.alert("Missing info", "Please enter both provider and AWB.");
      return;
    }
    try {
      await createOwnerShipment(id!, {
        provider: shipProvider.trim(),
        awb: shipAwb.trim(),
        notes: shipNotes.trim() || undefined,
      });
      setShipOpen(false);
      setShipProvider("");
      setShipAwb("");
      setShipNotes("");
      await load(false);
    } catch (e: any) {
      Alert.alert(
        "Shipment failed",
        e?.response?.data?.error?.message || e?.message || "Please retry"
      );
    }
  };

  const doDelivered = async () => {
    try {
      await markOwnerOrderDelivered(id!);
      await load(false);
    } catch (e: any) {
      Alert.alert(
        "Action failed",
        e?.response?.data?.error?.message || e?.message || "Please retry"
      );
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.neutral.background }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={
        <RefreshControl
          tintColor={colors.brand.accent}
          refreshing={refreshing}
          onRefresh={() => load(true)}
        />
      }
    >
      <Header
        title={`Order ${data?.order_number ?? id}`}
        subtitle={data?.placed_at ? formatRelative(data.placed_at) : ""}
      />
      {!!error && <ErrorBanner message={error} onRetry={() => load(false)} />}

      {/* Status & totals */}
      <Card>
        <Text style={styles.section}>Status</Text>
        <KeyValue label="Order" value={data?.status ?? "—"} />
        <KeyValue label="Payment" value={data?.payment_status ?? "—"} />
      </Card>

      <Card>
        <Text style={styles.section}>Totals</Text>
        <KeyValue
          label="Subtotal"
          value={formatCurrencyINR(data?.totals.subtotal ?? 0)}
        />
        <KeyValue
          label="Shipping"
          value={formatCurrencyINR(data?.totals.shipping ?? 0)}
        />
        <KeyValue
          label="Discount"
          value={formatCurrencyINR(data?.totals.discount ?? 0)}
        />
        <KeyValue
          label="Paid"
          value={formatCurrencyINR(data?.totals.paid ?? 0)}
        />
        <KeyValue
          label="Due"
          value={formatCurrencyINR(data?.totals.due ?? 0)}
        />
        <KeyValue
          label="Payable"
          value={formatCurrencyINR(data?.totals.payable ?? 0)}
        />
      </Card>

      {/* Customer & shipping */}
      <Card>
        <Text style={styles.section}>Customer</Text>
        <KeyValue label="Name" value={data?.customer.name ?? "—"} />
        <KeyValue label="Phone" value={data?.customer.phone ?? "—"} />
        <KeyValue
          label="Address"
          value={[
            data?.customer.address,
            data?.customer.city,
            data?.customer.state,
            data?.customer.pincode,
          ]
            .filter(Boolean)
            .join(", ")}
        />
      </Card>

      {/* Items */}
      <Card>
        <Text style={styles.section}>Items</Text>
        {(data?.items ?? []).map((it) => (
          <View key={it.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {it.title}
              </Text>
              <Text style={styles.itemMeta}>
                Qty {it.qty}
                {it.variant ? ` · ${it.variant}` : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.itemPrice}>
                {formatCurrencyINR(it.subtotal)}
              </Text>
              <Text style={styles.itemMeta}>
                {formatCurrencyINR(it.price)} each
              </Text>
            </View>
          </View>
        ))}
        {(data?.items ?? []).length === 0 && (
          <Text style={styles.empty}>No items</Text>
        )}
      </Card>

      {/* Shipment (if exists) */}
      {data?.shipment ? (
        <Card>
          <Text style={styles.section}>Shipment</Text>
          <KeyValue label="Provider" value={data.shipment.provider ?? "—"} />
          <KeyValue label="AWB" value={data.shipment.awb ?? "—"} />
          <KeyValue label="Status" value={data.shipment.status ?? "—"} />
        </Card>
      ) : null}

      {/* Quick actions */}
      <Card>
        <Text style={styles.section}>Actions</Text>

        {canPack && (
          <Button title="Mark as Packed" onPress={() => doStatus("PACKED")} />
        )}

        {canShip && (
          <View style={{ marginTop: spacing.md }}>
            <Button title="Create Shipment" onPress={() => setShipOpen(true)} />
          </View>
        )}

        {canDeliver && (
          <View style={{ marginTop: spacing.md }}>
            <Button title="Mark as Delivered" onPress={doDelivered} />
          </View>
        )}

        {canCancel && (
          <View style={{ marginTop: spacing.md }}>
            <Button
              title="Cancel Order"
              tone="ghost"
              onPress={() =>
                Alert.alert("Cancel order?", "This action cannot be undone.", [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes, cancel",
                    style: "destructive",
                    onPress: () => doStatus("CANCELLED"),
                  },
                ])
              }
            />
          </View>
        )}
      </Card>

      {/* Shipment modal */}
      <Modal
        visible={shipOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setShipOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create shipment</Text>
            <TextInput
              value={shipProvider}
              onChangeText={setShipProvider}
              placeholder="Provider (e.g. Delhivery)"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
            <TextInput
              value={shipAwb}
              onChangeText={setShipAwb}
              placeholder="AWB / Tracking number"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
            <TextInput
              value={shipNotes}
              onChangeText={setShipNotes}
              placeholder="Notes (optional)"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, { height: 92 }]}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setShipOpen(false)}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={doShip}>
                <Text style={styles.btnText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.neutral.white,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  empty: { color: colors.neutral.muted },
  itemRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.accentDark,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  itemTitle: { color: colors.neutral.white, fontWeight: "800" },
  itemMeta: { color: colors.neutral.muted, fontSize: 12, marginTop: 2 },
  itemPrice: { color: colors.brand.accent, fontWeight: "900" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "88%",
    backgroundColor: colors.neutral.surface,
    borderRadius: 14,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
  },
  modalTitle: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: "#0f2a11",
    borderColor: "#1f3f22",
    borderWidth: 1,
    borderRadius: 10,
    color: colors.neutral.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btn: {
    backgroundColor: colors.brand.accent,
    borderColor: colors.brand.accentDark,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  btnText: { color: "#111", fontWeight: "800" },
  btnGhost: { backgroundColor: "transparent", borderColor: "#334155" },
  btnGhostText: { color: "#e2e8f0", fontWeight: "700" },
});
