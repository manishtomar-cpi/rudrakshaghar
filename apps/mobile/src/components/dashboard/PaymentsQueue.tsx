import { View, Text, StyleSheet, Pressable } from "react-native";
import { Card } from "../shared/Card";
import { colors, spacing } from "../../theme";
import { formatCurrencyINR } from "../../features/dashboard/transformers";

type Item = {
  orderId: string;
  orderNumber?: string;
  amount: number; // already in rupees at the callsite
  customerName?: string | null;
};

export function PaymentsQueue({
  items,
  onSeeAll,
  onRowPress,
}: {
  items: Item[];
  onSeeAll: () => void;
  onRowPress: (orderId: string) => void;
}) {
  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payments to review</Text>
          <Text style={styles.sub}>Last {items.length} submissions</Text>
        </View>
        <Pressable style={styles.seeAll} onPress={onSeeAll}>
          <Text style={styles.seeAllTxt}>See all</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>No pending payments</Text>
      ) : (
        items.map((p) => (
          <Pressable
            key={p.orderId}
            style={styles.row}
            onPress={() => onRowPress(p.orderId)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {`Order ${
                  p.orderNumber ?? `#${String(p.orderId).slice(0, 8)}`
                }`}
              </Text>

              <Text style={styles.rowMeta}>{p.customerName ?? "—"}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrencyINR(p.amount)}</Text>
          </Pressable>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { color: colors.neutral.white, fontWeight: "800" },
  sub: { color: colors.neutral.muted, fontSize: 12 },
  seeAll: {
    marginLeft: "auto",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
    backgroundColor: "#0f2a11",
  },
  seeAllTxt: { color: colors.neutral.white, fontWeight: "700" },
  empty: {
    color: colors.neutral.muted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.brand.accentDark,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowTitle: { color: colors.neutral.white, fontWeight: "800" },
  rowMeta: { color: colors.neutral.muted, fontSize: 12, marginTop: 2 },
  amount: { color: colors.brand.accent, fontWeight: "900" },
});
