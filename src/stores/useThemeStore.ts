import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeName = 'theme1' | 'theme2';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'theme1',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'theme1' ? 'theme2' : 'theme1' }),
    }),
    {
      name: 'home-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
