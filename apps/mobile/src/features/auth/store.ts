import { create } from 'zustand';
import { api } from '../../api/axios';
import { getRefreshToken, saveRefreshToken, deleteRefreshToken } from '../../storage/secureStore';
import type { MeResponse, LoginResponse, RefreshResponse, User } from './types';

type AuthState = {
  accessToken: string | null;
  me: MeResponse | null;
  setAccessToken: (t: string | null) => void;
  reset: () => void;
  bootstrap: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const authStore = create<AuthState>((set) => ({
  accessToken: null,
  me: null,
  setAccessToken: (t) => set({ accessToken: t }),
  reset: () => set({ accessToken: null, me: null }),

  bootstrap: async () => {
    try {
      const rt = await getRefreshToken();
      if (!rt) return false;

      const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken: rt });
      const at = data?.accessToken;
      const newRt = data?.refreshToken;
      if (!at || !newRt) throw new Error('Invalid refresh response');

      await saveRefreshToken(newRt);
      set({ accessToken: at });

      const me = await api.get<MeResponse>('/auth/me').then((r) => r.data);
      if (me.role !== 'OWNER') throw new Error('Not owner');
      set({ me });
      return true;
    } catch {
      await deleteRefreshToken();
      set({ accessToken: null, me: null });
      return false;
    }
  },

  login: async (email, password) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    const at = data?.accessToken;
    const rt = data?.refreshToken;
    const user: User | undefined = data?.user;

    if (!at || !rt) throw new Error('Invalid login response');

    await saveRefreshToken(rt);
    set({ accessToken: at });

    const me: MeResponse = { userId: user?.id ?? 'unknown', role: (user?.role ?? 'OWNER'), user };
    if (me.role !== 'OWNER') throw new Error('Unauthorized role');

    set({ me });
  },

  logout: async () => {
    try { await api.post('/auth/logout', {}); } catch {}
    await deleteRefreshToken();
    set({ accessToken: null, me: null });
  },
}));

// Selector hooks
export const useMe = () => authStore((state) => state.me);
export const useAccessToken = () => authStore((state) => state.accessToken);
