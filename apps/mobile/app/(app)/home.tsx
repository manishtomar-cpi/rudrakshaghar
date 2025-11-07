import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { authStore, useMe } from '../../src/features/auth/store';
import { colors } from '../../src/theme';

export default function Home() {
  const router = useRouter();
  const me = useMe();

  const logout = async () => {
    await authStore.getState().logout();
    router.replace('/(auth)/login');
  };

  const displayName =
    me?.user?.name?.trim() ||
    me?.user?.email ||
    me?.userId;

  return (
    <View style={styles.container}>
      <Text style={styles.txt}>Signed in as {displayName}</Text>
      <Pressable style={styles.btn} onPress={logout}>
        <Text style={styles.btnTxt}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.background, alignItems: 'center', justifyContent: 'center' },
  txt: { color: '#fff', marginBottom: 12 },
  btn: { backgroundColor: colors.brand.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnTxt: { color: '#111', fontWeight: '700' },
});
