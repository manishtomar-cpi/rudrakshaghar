import { View, Text, StyleSheet, Pressable } from "react-native";
import { Card } from "../shared/Card";
import { colors, spacing } from "../../theme";

export function CatalogSignals({ lowOrNoImage, recent, onFixNow, onOpenCatalog }: {
  lowOrNoImage: number;
  recent: Array<{ productId: string; title: string; updatedAt: string; active: boolean }>;
  onFixNow?: () => void;
  onOpenCatalog?: () => void;
}) {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.title}>Catalog health</Text>
        <Pressable onPress={onOpenCatalog}><Text style={styles.link}>Open catalog</Text></Pressable>
      </View>
      <Text style={styles.meta}>
        {lowOrNoImage > 0 ? `${lowOrNoImage} active product(s) without a primary image` : "All active products have images"}
      </Text>
      {lowOrNoImage > 0 && (
        <Pressable onPress={onFixNow} style={{ marginTop: spacing.sm }}>
          <Text style={styles.fix}>Fix now →</Text>
        </Pressable>
      )}
      {recent.length ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.sub}>Recently updated</Text>
          {recent.slice(0, 5).map((r) => (
            <Text key={r.productId} style={styles.recent}>• {r.title}</Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.neutral.white, fontWeight: "800", fontSize: 16 },
  link: { color: colors.brand.accent, fontWeight: "800" },
  meta: { color: colors.neutral.muted, marginTop: spacing.sm },
  fix: { color: colors.brand.accent, fontWeight: "900" },
  sub: { color: colors.neutral.white, fontWeight: "700", marginBottom: 6 },
  recent: { color: colors.neutral.muted },
});
