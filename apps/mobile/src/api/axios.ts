import axios from 'axios';
import { getRefreshToken, saveRefreshToken, deleteRefreshToken } from '../storage/secureStore';
import { authStore } from '../features/auth/store';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  try {
    const rt = await getRefreshToken();
    if (!rt) return null;
    const { data } = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE}/auth/refresh`, { refreshToken: rt });
    const newAT: string | undefined = data?.accessToken;
    const newRT: string | undefined = data?.refreshToken;
    if (!newAT || !newRT) return null;
    await saveRefreshToken(newRT);
    authStore.getState().setAccessToken(newAT);
    return newAT;
  } catch {
    return null;
  } finally {
    refreshing = null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    if (!original) return Promise.reject(error);

    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      const newAT = await (refreshing ?? (refreshing = refreshToken()));
      if (newAT) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newAT}` };
        return api(original);
      }
      // hard logout if refresh failed
      await deleteRefreshToken();
      authStore.getState().reset();
    }
    return Promise.reject(error);
  }
);
