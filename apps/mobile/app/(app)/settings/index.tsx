import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../../../src/theme";
import { Header } from "../../../src/components/shared/Header";
import { Card } from "../../../src/components/shared/Card";

export default function SettingsIndex() {
  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.lg }}>
        <Header title="Business settings" subtitle="App settings + UPI" />
        <Card><Text style={{ color: colors.neutral.muted }}>TODO: bind to /owner/app-settings APIs</Text></Card>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.neutral.background }});
