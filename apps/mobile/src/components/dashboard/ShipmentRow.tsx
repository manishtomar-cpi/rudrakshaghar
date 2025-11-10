import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme";
import { formatRelative } from "../../features/dashboard/transformers";

export function ShipmentRow({ orderId, status, placedAt, onPress }: { orderId: string; status: string; placedAt: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Order {orderId}</Text>
        <Text style={styles.sub}>Status: {status}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.meta}>{formatRelative(placedAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.brand.accentDark, columnGap: spacing.md },
  title: { color: colors.neutral.white, fontWeight: "800" },
  sub: { color: colors.neutral.muted, marginTop: 2 },
  meta: { color: colors.neutral.muted, fontSize: 12, marginTop: 2 },
});
