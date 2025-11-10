import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme";
import { formatCurrencyINR, formatRelative } from "../../features/dashboard/transformers";

export function PaymentRow({ orderId, amount, submittedAt, customer, onPress }: {
  orderId: string; amount: number; submittedAt: string; customer?: { name?: string | null; phone?: string | null } | null; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Order {orderId}</Text>
        <Text style={styles.sub}>{customer?.name || customer?.phone || "Anonymous"}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.amount}>{formatCurrencyINR(amount)}</Text>
        <Text style={styles.meta}>{formatRelative(submittedAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.brand.accentDark, columnGap: spacing.md },
  title: { color: colors.neutral.white, fontWeight: "800" },
  sub: { color: colors.neutral.muted, marginTop: 2 },
  amount: { color: colors.brand.accent, fontWeight: "900" },
  meta: { color: colors.neutral.muted, fontSize: 12, marginTop: 2 },
});
