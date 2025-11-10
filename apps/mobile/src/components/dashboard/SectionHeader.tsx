import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";

export function SectionHeader({ title, subtitle, actionLabel, onActionPress }: { title: string; subtitle?: string; actionLabel?: string; onActionPress?: () => void }) {
  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
      </View>
      {!!actionLabel && onActionPress && (
        <Pressable onPress={onActionPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}>
          <Text style={styles.actionTxt}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  title: { color: colors.neutral.white, fontWeight: "800", fontSize: 16 },
  sub: { color: colors.neutral.muted, marginTop: 2 },
  action: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.brand.accentDark },
  actionTxt: { color: colors.brand.accent, fontWeight: "800", fontSize: 12 },
});
