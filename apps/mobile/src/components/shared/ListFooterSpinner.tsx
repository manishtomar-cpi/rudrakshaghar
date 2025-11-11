// apps/mobile/src/components/shared/ListFooterSpinner.tsx
import { ActivityIndicator, View } from "react-native";
import { colors, spacing } from "../../theme";

export function ListFooterSpinner({ visible }: { visible: boolean }) {
  if (!visible) return <View style={{ height: 20 }} />;
  return (
    <View style={{ paddingVertical: spacing.md }}>
      <ActivityIndicator size="small" color={colors.brand.accent} />
    </View>
  );
}
