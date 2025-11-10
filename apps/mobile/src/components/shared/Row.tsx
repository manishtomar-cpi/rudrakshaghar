import { PropsWithChildren } from "react";
import { View, ViewStyle } from "react-native";

type Props = PropsWithChildren & { style?: ViewStyle; justify?: ViewStyle["justifyContent"]; align?: ViewStyle["alignItems"]; gap?: number };

export function Row({ children, style, justify = "space-between", align = "center", gap = 8 }: Props) {
  return <View style={[{ flexDirection: "row", alignItems: align, justifyContent: justify, columnGap: gap }, style]}>{children}</View>;
}
