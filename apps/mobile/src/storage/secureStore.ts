import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rudraksha_refresh';

function asString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v == null) throw new Error('SecureStore: value is null/undefined');
  return String(v);
}

export async function saveRefreshToken(token: unknown) {
  const value = asString(token);
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    await AsyncStorage.setItem(KEY, value);
  }
}

export async function getRefreshToken() {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    if (v != null) return v;
  } catch {}
  return AsyncStorage.getItem(KEY);
}

export async function deleteRefreshToken() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    await AsyncStorage.removeItem(KEY);
  }
}
