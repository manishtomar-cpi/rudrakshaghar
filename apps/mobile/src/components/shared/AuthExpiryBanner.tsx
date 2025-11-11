// apps/mobile/src/components/shared/AuthExpiryBanner.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing } from '../../theme';
import { onAuthExpired } from '../../api/axios';
import { useRouter } from 'expo-router';

export function AuthExpiryBanner() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const off = onAuthExpired(() => setVisible(true));
    // Ensure cleanup type is always void
    return () => {
      try {
        (off as any)?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.msg}>Session expired. Please sign in again.</Text>
      <Pressable
        onPress={() => {
          setVisible(false);
          try {
            router.push('/(auth)/login');
          } catch {
            router.push('/(app)/settings');
          }
        }}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.btnTxt}>Re-authenticate</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#2a1a1a',
    borderColor: colors.utility.error,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
  },
  msg: { color: colors.neutral.white, flex: 1 },
  btn: {
    backgroundColor: colors.brand.accent,
    borderColor: colors.brand.accentDark,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  btnTxt: { color: '#111', fontWeight: '800' },
});
