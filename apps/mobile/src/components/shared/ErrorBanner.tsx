// apps/mobile/src/components/shared/ErrorBanner.tsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing } from "../../theme";

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="alert" testID="error-banner">
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
      {!!onRetry && (
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}>
          <Text style={styles.btnTxt}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#3a241f",
    borderColor: colors.utility.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  text: { color: colors.neutral.white, flex: 1, fontWeight: "600" },
  btn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
    backgroundColor: colors.brand.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  btnTxt: { color: "#111", fontWeight: "800" },
});
