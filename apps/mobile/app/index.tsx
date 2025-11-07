import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { authStore } from '../src/features/auth/store';
import { RudrakshaSpinner } from '../src/components/RudrakshaSpinner';
import { colors, spacing } from '../src/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    authStore.getState().bootstrap().then((ok) => {
      if (!mounted) return;
      router.replace(ok ? '/(app)/home' : '/(auth)/login');
    });
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <RudrakshaSpinner size={64} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 220, height: 120, marginBottom: spacing.xl },
});
