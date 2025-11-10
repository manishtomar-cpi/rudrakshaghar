import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Something went wrong</Text>
      {message ? <Text style={styles.sub}>{message}</Text> : null}
      {onRetry ? <Button title="Retry" onPress={onRetry} style={{ marginTop: spacing.md }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing.lg },
  title: { color: colors.utility.error, fontWeight: "800" },
  sub: { color: colors.neutral.muted, marginTop: 6, textAlign: "center" },
});
