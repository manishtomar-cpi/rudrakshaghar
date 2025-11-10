import { View, Text, StyleSheet, Pressable } from "react-native";
import { Card } from "../shared/Card";
import { SectionHeader } from "./SectionHeader";
import { colors, spacing } from "../../theme";
import { formatCurrencyINR } from "../../features/dashboard/transformers";

export function TopProductsList({ items, onItemPress }: { items: Array<{ productId: string; title: string; qty: number; revenue: number }>; onItemPress?: (id: string) => void }) {
  return (
    <Card>
      <SectionHeader title="Top products" subtitle="By revenue" />
      <View>
        {items.map((it) => (
          <Pressable key={it.productId} onPress={() => onItemPress?.(it.productId)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{it.title}</Text>
              <Text style={styles.meta}>{it.qty} sold</Text>
            </View>
            <Text style={styles.amt}>{formatCurrencyINR(it.revenue)}</Text>
          </Pressable>
        ))}
        {items.length === 0 && <Text style={styles.empty}>No sales in this window</Text>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.brand.accentDark, flexDirection: "row", alignItems: "center", columnGap: spacing.md },
  title: { color: colors.neutral.white, fontWeight: "800" },
  meta: { color: colors.neutral.muted, marginTop: 2, fontSize: 12 },
  amt: { color: colors.brand.accent, fontWeight: "900" },
  empty: { color: colors.neutral.muted },
});
