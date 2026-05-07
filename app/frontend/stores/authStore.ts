import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.login(email, password);
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      register: async (name, email, password, passwordConfirmation) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.register(name, email, password, passwordConfirmation);
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch { /* ignore */ }
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
