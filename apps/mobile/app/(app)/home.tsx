import { View, StyleSheet } from "react-native";
import DashboardScreen from "../../src/components/dashboard/DashboardScreen";
import { colors } from "../../src/theme";

export default function Home() {
  return (
    <View style={styles.container}>
      {/* No filter chips on the dashboard (Phase 0) */}
      <DashboardScreen range={{ kind: "7d" }} tz="Asia/Kolkata" limit={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
});
