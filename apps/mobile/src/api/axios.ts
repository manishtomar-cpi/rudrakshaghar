// src/api/axios.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getRefreshToken, saveRefreshToken, deleteRefreshToken } from '../storage/secureStore';
import { getAccessToken, setSessionAccessToken, resetSession } from '../features/auth/session';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE,
  timeout: 15000,
});

// Small helper to set Authorization header safely across Axios v1 types
function setAuthHeader(
  headers: InternalAxiosRequestConfig['headers'] | undefined,
  token: string
) {
  // If it's AxiosHeaders (has set()), use it:
  if (headers && typeof (headers as any).set === 'function') {
    (headers as any).set('Authorization', `Bearer ${token}`);
    return headers;
  }
  // Otherwise merge into a plain object (fallback):
  return { ...(headers as Record<string, any> | undefined), Authorization: `Bearer ${token}` } as any;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = setAuthHeader(config.headers, token);
  }
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
    setSessionAccessToken(newAT);
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
    const original = error?.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    // 401 → try refresh once
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      const newAT = await (refreshing ?? (refreshing = refreshToken()));
      if (newAT) {
        original.headers = setAuthHeader(original.headers, newAT);
        return api(original);
      }
      // refresh failed → hard reset
      await deleteRefreshToken();
      resetSession();
    }

    // Helpful log for 5xx during dev
    if (__DEV__ && error?.response?.status >= 500) {
      console.warn('[api 5xx]', original?.method?.toUpperCase(), original?.url, {
        status: error.response.status,
        data: error.response.data,
      });
    }
    return Promise.reject(error);
  }
);
