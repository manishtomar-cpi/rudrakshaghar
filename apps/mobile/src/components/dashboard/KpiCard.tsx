import { Pressable, Text, StyleSheet, ViewStyle, View } from "react-native";
import { colors, spacing } from "../../theme";

type Props = {
  title: string;
  value: string | number;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
  onPress?: () => void;
  style?: ViewStyle;
};

export function KpiCard({ title, value, tone = "default", onPress, style }: Props) {
  const background =
    tone === "accent" ? colors.brand.accent :
    tone === "success" ? colors.utility.success :
    tone === "warning" ? colors.utility.warning :
    tone === "danger" ? colors.utility.error :
    colors.neutral.surface;

  const textColor = tone === "accent" ? "#1b1b1b" : colors.neutral.white;

  const content = (
    <View style={[styles.card, { backgroundColor: background, borderColor: colors.brand.accentDark }, style]}>
      <Text style={[styles.value, { color: textColor }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>{title}</Text>
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>{content}</Pressable>
  ) : content;
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: spacing.md, minWidth: 110 },
  value: { fontSize: 20, fontWeight: "900" },
  title: { marginTop: 4, fontSize: 12, fontWeight: "700" },
});
