import { View, StyleSheet } from "react-native";
import { colors } from "../../theme";

export function Divider() {
  return <View style={styles.hr} />;
}
const styles = StyleSheet.create({
  hr: { height: 1, backgroundColor: colors.brand.accentDark, opacity: 0.35, marginVertical: 8 },
});
