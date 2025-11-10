import { View, StyleSheet } from "react-native";
import { Card } from "../shared/Card";
import { spacing, colors } from "../../theme";

const shimmer = { backgroundColor: "#123015" };

export function KpiGridSkeleton() {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: spacing.md, rowGap: spacing.md }}>
      {[0,1,2,3,4,5].map(i => <View key={i} style={[styles.kpi, shimmer]} />)}
    </View>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      {[...Array(rows)].map((_, i) => <View key={i} style={[styles.row, shimmer]} />)}
    </Card>
  );
}

export function ChartSkeleton() {
  return <Card><View style={[styles.chart, shimmer]} /></Card>;
}

const styles = StyleSheet.create({
  kpi: { height: 74, borderRadius: 12, width: "48%" },
  row: { height: 48, borderRadius: 10, marginVertical: 6 },
  chart: { height: 90, borderRadius: 12 },
});
