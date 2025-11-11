// apps/mobile/src/components/filters/HistoryFilterBar.tsx
import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, TextInput } from "react-native";
import { colors, spacing } from "../../theme";
import type { Range } from "../../features/dashboard/range";
import { labelFor, todayRange } from "../../features/dashboard/range";

type Props = {
  value: Range;
  onChange: (r: Range) => void;
  enableCustom?: boolean;
};

export function HistoryFilterBar({ value, onChange, enableCustom = false }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const is = (k: Range["kind"]) => value.kind === k;
  const isCustom = value.kind === "custom";

  const Chip = ({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      <Chip label="Today" active={is("today")} onPress={() => onChange({ kind: "today" })} />
      <Chip label="7d" active={is("7d")} onPress={() => onChange({ kind: "7d" })} />
      <Chip label="30d" active={is("30d")} onPress={() => onChange({ kind: "30d" })} />
      <Chip label="90d" active={is("90d")} onPress={() => onChange({ kind: "90d" })} />

      {enableCustom && (
        <Chip
          label={isCustom ? labelFor(value) : "Custom"}
          active={isCustom}
          onPress={() => {
            const t = todayRange(); // now typed as custom range; .start/.end exist
            setStart(t.start);
            setEnd(t.end);
            setCustomOpen(true);
          }}
        />
      )}

      <Modal visible={customOpen} transparent animationType="fade" onRequestClose={() => setCustomOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Custom range</Text>
            <TextInput
              value={start}
              onChangeText={setStart}
              placeholder="Start (YYYY-MM-DD)"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              value={end}
              onChangeText={setEnd}
              placeholder="End (YYYY-MM-DD)"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setCustomOpen(false)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.btn}
                onPress={() => {
                  onChange({ kind: "custom", start, end });
                  setCustomOpen(false);
                }}
              >
                <Text style={styles.btnText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
    backgroundColor: "#0f2a11",
  },
  chipActive: { backgroundColor: colors.brand.accent, borderColor: colors.brand.accentDark },
  chipText: { color: "#cbd5e1", fontWeight: "700" },
  chipTextActive: { color: "#111827" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalCard: {
    width: "88%",
    backgroundColor: colors.neutral.surface,
    borderRadius: 14,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
  },
  modalTitle: { color: colors.neutral.white, fontSize: 18, fontWeight: "800", marginBottom: spacing.md },
  input: {
    backgroundColor: "#0f2a11",
    borderColor: "#1f3f22",
    borderWidth: 1,
    borderRadius: 10,
    color: colors.neutral.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.md, marginTop: spacing.sm },
  btn: {
    backgroundColor: colors.brand.accent,
    borderColor: colors.brand.accentDark,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  btnText: { color: "#111", fontWeight: "800" },
  btnGhost: { backgroundColor: "transparent", borderColor: "#334155" },
  btnGhostText: { color: "#e2e8f0", fontWeight: "700" },
});
