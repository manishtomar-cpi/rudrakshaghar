import { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { authStore } from '../../src/features/auth/store';
import { RudrakshaSpinner } from '../../src/components/RudrakshaSpinner';
import { toast } from '../../src/utils/toast';
import { colors, spacing } from '../../src/theme';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) return toast.error('Missing details', 'Email and password required');
    try {
      setLoading(true);
      await authStore.getState().login(email.trim(), password);
      toast.success('Welcome', 'Signed in as Owner');
      router.replace('/(app)/home');
    } catch (e: any) {
      toast.error('Login failed', e?.response?.data?.error?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.card}>
        <Text style={styles.title}>Owner Sign in</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]} onPress={onLogin} disabled={loading}>
          {loading ? <RudrakshaSpinner size={28} /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>
      </View>
      <Text style={styles.footer}>Rudrakshaghar © {new Date().getFullYear()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.primary, padding: spacing.xl, alignItems: 'center' },
  logo: { width: 240, height: 130, marginTop: 56, marginBottom: spacing.xl },
  card: {
    width: '100%',
    backgroundColor: colors.neutral.surface,
    borderRadius: 14,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
  },
  title: { color: colors.neutral.white, fontSize: 20, fontWeight: '700', marginBottom: spacing.lg },
  input: {
    backgroundColor: '#0f2a11',
    borderColor: '#1f3f22',
    borderWidth: 1,
    borderRadius: 10,
    color: colors.neutral.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.accent,
    borderWidth: 1,
    borderColor: colors.brand.accentDark,
  },
  buttonText: { color: '#1b1b1b', fontWeight: '800', fontSize: 16 },
  footer: { color: '#d1d5db', marginTop: spacing.xl },
});
