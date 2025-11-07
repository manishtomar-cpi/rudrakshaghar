import { Stack, Redirect } from 'expo-router';
import { useAccessToken } from '../../src/features/auth/store';

export default function AppLayout() {
  const at = useAccessToken();
  if (!at) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
