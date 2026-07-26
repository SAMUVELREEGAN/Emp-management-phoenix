import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setLoggingOut: (value: boolean) => void;
  hydrate: () => Promise<void>;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoggingOut: false,
      hydrated: false,

      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true, isLoggingOut: false });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isLoggingOut: false });
      },

      setLoggingOut: value => {
        set({ isLoggingOut: value });
      },

      setHydrated: value => {
        set({ hydrated: value });
      },

      hydrate: async () => {
        if (get().hydrated) {
          return;
        }
        await useAuthStore.persist.rehydrate();
        set({ hydrated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (!error) {
          useAuthStore.setState({ hydrated: true });
        }
      },
    },
  ),
);
