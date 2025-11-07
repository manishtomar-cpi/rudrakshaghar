import { Stack } from 'expo-router';
import { ToastHost } from '../src/components/ToastHost';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <ToastHost />
    </>
  );
}
