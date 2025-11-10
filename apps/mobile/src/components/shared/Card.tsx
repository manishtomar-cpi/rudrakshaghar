import { PropsWithChildren } from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";

type Props = PropsWithChildren & { style?: ViewStyle };

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
    padding: spacing.lg,
  },
});
