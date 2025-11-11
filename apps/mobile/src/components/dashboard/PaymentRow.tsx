// apps/mobile/src/components/dashboard/PaymentRow.tsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing } from "../../theme";
import { formatCurrencyINR } from "../../features/dashboard/transformers";

type Props = {
  orderId: string;
  orderNumber?: string;                // ✅ NEW
  amount: number;                      // rupees
  submittedAt?: string | null;
  customer?: { name?: string | null };
  onPress?: () => void;
};

export function PaymentRow({
  orderId,
  orderNumber,
  amount,
  submittedAt,
  customer,
  onPress,
}: Props) {
  const displayOrder = orderNumber ?? `#${String(orderId).slice(0, 8)}`; // ✅ short fallback

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{`Order ${displayOrder}`}</Text>
        <Text style={styles.meta}>{customer?.name ?? "—"}</Text>
      </View>
      <Text style={styles.amount}>{formatCurrencyINR(amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.brand.accentDark,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  title: { color: colors.neutral.white, fontWeight: "800" },
  meta: { color: colors.neutral.muted, fontSize: 12, marginTop: 2 },
  amount: { color: colors.brand.accent, fontWeight: "900" },
});
