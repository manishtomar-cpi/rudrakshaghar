import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../src/theme';
import DashboardScreen from '../../src/components/dashboard/DashboardScreen';
import { HistoryFilterBar } from '../../src/components/filters/HistoryFilterBar';
import type { Range } from '../../src/features/dashboard/range';

export default function Home() {
  const [range, setRange] = useState<Range>({ kind: '7d' }); // default 7d

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.sub}> {range.kind === '7d' ? 'Last 7 days' : ''} </Text>

      {/* Filters */}
      <HistoryFilterBar value={range} onChange={setRange} enableCustom={true /* turn off if backend can't do start/end */} />

      {/* Dashboard body */}
      <View style={{ flex: 1 }}>
        <DashboardScreen range={range} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background },
  title: { color: colors.neutral.white, fontSize: 26, fontWeight: '800', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sub: { color: '#93a3a9', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
});
