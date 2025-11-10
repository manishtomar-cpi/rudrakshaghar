import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing.lg },
  title: { color: colors.neutral.muted, fontWeight: "700" },
  sub: { color: colors.neutral.muted, marginTop: 4 },
});
