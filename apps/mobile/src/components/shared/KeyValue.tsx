// apps/mobile/src/components/shared/KeyValue.tsx
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing } from "../../theme";

export function KeyValue({
  label,
  value,
  style,
}: {
  label: string;
  value?: string | number | null;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.key}>{label}</Text>
      <Text style={styles.val}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1f3f22",
  },
  key: { color: colors.neutral.muted, fontWeight: "600" },
  val: { color: colors.neutral.white, fontWeight: "700", maxWidth: "60%", textAlign: "right" },
});
