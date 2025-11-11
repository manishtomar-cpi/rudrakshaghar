// apps/mobile/src/components/dashboard/MiniChart.tsx
import { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Card } from "../shared/Card";
import { colors, spacing } from "../../theme";

type Pt = { x: string | number; y: number };

export function MiniChart({
  title,
  points,
  summary,
  hint,
}: {
  title: string;
  points: Pt[];
  summary?: string;
  hint?: string;
}) {
  const [width, setWidth] = useState<number>(0);
  const HEIGHT = 64;
  const PAD = 2;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - width) > 1) setWidth(w);
  };

  const safePoints = Array.isArray(points) ? points.filter((p) => Number.isFinite(p.y)) : [];
  const ys = safePoints.map((p) => p.y);
  const maxY = Math.max(1, ...ys);
  const n = safePoints.length;

  let d = "";
  if (width > 0 && n > 0) {
    for (let i = 0; i < n; i++) {
      const px = PAD + (i / Math.max(1, n - 1)) * (width - PAD * 2);
      const py = HEIGHT - PAD - (safePoints[i].y / maxY) * (HEIGHT - PAD * 2);
      d += `${i === 0 ? "M" : "L"}${px},${py} `;
    }
    if (n === 1) {
      const px2 = Math.max(PAD + 1, width - PAD - 1);
      d += `L${px2},${HEIGHT - PAD - (safePoints[0].y / maxY) * (HEIGHT - PAD * 2)}`;
    }
  }

  return (
    <View onLayout={onLayout}>
      <Card style={{ padding: spacing.md }}>
        <Text style={styles.title}>{title}</Text>
        <Svg width="100%" height={HEIGHT}>
          {d ? (
            <Path d={d.trim()} stroke={colors.brand.accent} strokeWidth={2} fill="none" />
          ) : (
            <Path
              d={`M${PAD},${HEIGHT - PAD} L${Math.max(PAD + 1, width - PAD)},${HEIGHT - PAD}`}
              stroke={colors.brand.accentDark}
              strokeWidth={1}
              fill="none"
            />
          )}
        </Svg>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {!!summary && <Text style={styles.summary}>{summary}</Text>}
          {!!hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.neutral.white, fontWeight: "800", marginBottom: 6 },
  summary: { color: colors.brand.accent, fontWeight: "800" },
  hint: { color: colors.neutral.muted, fontSize: 12 },
});
