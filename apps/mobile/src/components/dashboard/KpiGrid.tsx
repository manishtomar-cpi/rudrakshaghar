import { View, StyleSheet } from "react-native";
import { spacing } from "../../theme";
import { KpiCard } from "./KpiCard";

type Item = Parameters<typeof KpiCard>[0];

export function KpiGrid({ items, columns = 2 }: { items: Item[]; columns?: 2 | 3 }) {
  const gap = spacing.md;
  return (
    <View style={[styles.grid, { columnGap: gap, rowGap: gap }]}>
      {items.map((it, idx) => (
        <View key={idx} style={{ flexBasis: `${100 / columns}%` }}>
          <KpiCard {...it} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
});
