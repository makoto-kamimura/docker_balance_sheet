import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        set({ hydrated: true });
        return;
      }
      try {
        const user = await authApi.me();
        set({ user, token, hydrated: true });
      } catch {
        // トークン期限切れ等
        await AsyncStorage.removeItem('token');
        set({ user: null, token: null, hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authApi.login(email, password);
      await AsyncStorage.setItem('token', token);
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
      await AsyncStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
