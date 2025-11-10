import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { color: colors.neutral.white, fontSize: 22, fontWeight: "800" },
  sub: { color: colors.neutral.muted, marginTop: 2 },
});
