import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { spacing } from "../../theme";
import { KpiCard } from "./KpiCard";

type Item = Parameters<typeof KpiCard>[0];

type Props = {
  items: Item[];
  /** kept for backward compatibility with the existing grid usage */
  columns?: 2 | 3;
  /** NEW: when true, renders a horizontal, scrollable strip of KPI tiles */
  horizontal?: boolean;
  /** Optional width for each tile when horizontal */
  itemWidth?: number;
  /** Optional gap between tiles (both modes) */
  gap?: number;
};

export function KpiGrid({
  items,
  columns = 2,
  horizontal = false,
  itemWidth = 170,
  gap = spacing.md,
}: Props) {
  if (horizontal) {
    return (
      <FlatList
        horizontal
        data={items}
        keyExtractor={(_, i) => String(i)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ columnGap: gap }}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>
            <KpiCard {...item} />
          </View>
        )}
      />
    );
  }

  // Fallback to the original grid (unchanged behavior)
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
