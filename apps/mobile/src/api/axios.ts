// apps/mobile/src/api/axios.ts
import axios, { type InternalAxiosRequestConfig, AxiosError } from "axios";
import { getRefreshToken, saveRefreshToken, deleteRefreshToken } from "../storage/secureStore";
import { getAccessToken, setSessionAccessToken, resetSession } from "../features/auth/session";

/** Toggle used to enable/disable API debug (kept for future use) */
const DEBUG_API = __DEV__; // or: Boolean(process.env.EXPO_PUBLIC_DEBUG_API === "1")

/** Safe sampler to avoid printing huge payloads (retained for potential reuse) */
function safeSample(data: any) {
  try {
    if (data == null) return data;
    if (Array.isArray(data)) return data.slice(0, 1);
    if (typeof data === "object") {
      const json = JSON.stringify(data);
      return json.length > 1200 ? JSON.parse(json.substring(0, 1200)) : data;
    }
    return data;
  } catch {
    return data;
  }
}

/** Auth-expired pub/sub (UI can subscribe to show a banner) */
const authExpiredListeners = new Set<() => void>();
export function onAuthExpired(cb: () => void) {
  authExpiredListeners.add(cb);
  return () => authExpiredListeners.delete(cb);
}
function emitAuthExpired() {
  authExpiredListeners.forEach((fn) => fn());
}

/** Axios instance */
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE,
  timeout: 15000,
});

/** Set Authorization header safely across Axios v1 types */
function setAuthHeader(headers: InternalAxiosRequestConfig["headers"] | undefined, token: string) {
  if (headers && typeof (headers as any).set === "function") {
    (headers as any).set("Authorization", `Bearer ${token}`);
    return headers;
  }
  return { ...(headers as Record<string, any> | undefined), Authorization: `Bearer ${token}` } as any;
}

/** REQUEST interceptor: attach access token if present */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = setAuthHeader(config.headers, token);
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

/** Refresh access token using refresh token; returns new access token or null */
async function refreshToken(): Promise<string | null> {
  try {
    const rt = await getRefreshToken();
    if (!rt) {
      return null;
    }

    const { data } = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE}/auth/refresh`, {
      refreshToken: rt,
    });

    const newAT: string | undefined = data?.accessToken;
    const newRT: string | undefined = data?.refreshToken;

    if (!newAT || !newRT) {
      return null;
    }

    await saveRefreshToken(newRT);
    setSessionAccessToken(newAT);
    return newAT;
  } catch {
    return null;
  } finally {
    refreshing = null;
  }
}

/** Retry helpers (GET only) */
function isRetryableStatus(status?: number) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}
function isNetworkError(err: AxiosError) {
  return !!err.code && (err.code === "ECONNABORTED" || err.message?.includes("Network Error"));
}
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** RESPONSE interceptor: handle 401 refresh, limited GET retries */
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error?.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number })
      | undefined;

    if (!original) return Promise.reject(error);

    // 401 → attempt a single token refresh
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      const newAT = await (refreshing ?? (refreshing = refreshToken()));
      if (newAT) {
        original.headers = setAuthHeader(original.headers, newAT);
        return api(original);
      }
      // Refresh failed → clear session and notify UI
      await deleteRefreshToken();
      resetSession();
      emitAuthExpired();
    }

    // GET retry policy for transient errors (network or 429/502/503/504)
    const method = (original.method || "get").toLowerCase();
    const status = error.response?.status;
    const shouldRetry = method === "get" && (isNetworkError(error) || isRetryableStatus(status));

    if (shouldRetry) {
      const attempt = (original._retryCount ?? 0) + 1;
      if (attempt <= 2) {
        original._retryCount = attempt;
        const backoffMs = Math.round(300 * Math.pow(2, attempt - 1) + Math.random() * 150);
        await sleep(backoffMs);
        return api(original);
      }
    }

    return Promise.reject(error);
  }
);
