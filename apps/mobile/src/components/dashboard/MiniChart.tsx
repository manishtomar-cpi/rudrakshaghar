import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Card } from "../shared/Card";
import { colors, spacing } from "../../theme";

type Pt = { x: string | number; y: number };

export function MiniChart({ title, points, summary, hint }: { title: string; points: Pt[]; summary?: string; hint?: string }) {
  // simple normalized path
  const WIDTH = 280; const HEIGHT = 64; const PAD = 2;
  const xs = points.map((_, i) => i);
  const ys = points.map(p => p.y);
  const maxY = Math.max(1, ...ys);
  const path = xs.map((i, idx) => {
    const px = PAD + (i / Math.max(1, xs.length - 1)) * (WIDTH - PAD * 2);
    const py = HEIGHT - PAD - (ys[idx] / maxY) * (HEIGHT - PAD * 2);
    return `${idx === 0 ? "M" : "L"}${px},${py}`;
  }).join(" ");

  return (
    <Card style={{ padding: spacing.md }}>
      <Text style={styles.title}>{title}</Text>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Path d={path} stroke={colors.brand.accent} strokeWidth={2} fill="none" />
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {!!summary && <Text style={styles.summary}>{summary}</Text>}
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.neutral.white, fontWeight: "800", marginBottom: 6 },
  summary: { color: colors.brand.accent, fontWeight: "800" },
  hint: { color: colors.neutral.muted, fontSize: 12 },
});
