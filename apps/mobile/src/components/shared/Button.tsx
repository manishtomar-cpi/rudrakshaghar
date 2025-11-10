import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing } from "../../theme";

type Props = { title: string; onPress?: () => void; style?: ViewStyle; tone?: "primary" | "accent" | "ghost"; disabled?: boolean };

export function Button({ title, onPress, style, tone = "accent", disabled }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.base, styles[tone], style, pressed && { opacity: 0.9 }, disabled && { opacity: 0.6 }]} >
      <Text style={tone === "ghost" ? styles.ghostTxt : styles.txt}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg, borderWidth: 1 },
  primary: { backgroundColor: colors.brand.primary, borderColor: colors.brand.accentDark },
  accent: { backgroundColor: colors.brand.accent, borderColor: colors.brand.accentDark },
  ghost: { backgroundColor: "transparent", borderColor: colors.brand.accentDark },
  txt: { color: "#1b1b1b", fontWeight: "800" },
  ghostTxt: { color: colors.neutral.white, fontWeight: "700" },
});
