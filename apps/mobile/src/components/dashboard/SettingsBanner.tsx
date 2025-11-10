import { View, Text, StyleSheet } from "react-native";
import { Card } from "../shared/Card";
import { Button } from "../shared/Button";
import { colors, spacing } from "../../theme";

export function SettingsBanner({ configured, upiConfigured, missing, onPressAction }: { configured: boolean; upiConfigured: boolean; missing: string[]; onPressAction: () => void }) {
  if (configured && upiConfigured && (!missing || missing.length === 0)) return null;

  return (
    <Card style={{ borderColor: colors.utility.warning }}>
      <Text style={styles.title}>Finish your business setup</Text>
      {!configured && <Text style={styles.item}>• App settings not created</Text>}
      {configured && !upiConfigured && <Text style={styles.item}>• UPI VPA not configured</Text>}
      {configured && missing?.length ? <Text style={styles.item}>• Missing: {missing.join(", ")}</Text> : null}
      <Button title="Complete setup" onPress={onPressAction} style={{ marginTop: spacing.md }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.brand.accent, fontWeight: "900", fontSize: 14, marginBottom: spacing.sm },
  item: { color: colors.neutral.white, marginTop: 2 },
});
