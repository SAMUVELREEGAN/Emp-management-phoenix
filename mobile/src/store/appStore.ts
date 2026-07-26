import { create } from 'zustand';

interface AppState {
  globalLoading: boolean;
  setGlobalLoading: (value: boolean) => void;
}

export const useAppStore = create<AppState>(set => ({
  globalLoading: false,
  setGlobalLoading: value => set({ globalLoading: value }),
}));
