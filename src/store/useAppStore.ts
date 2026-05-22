import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface AppState {
  currentChapter: string
  theme: Theme
  toggleTheme: () => void
  setCurrentChapter: (chapter: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentChapter: 'Chapter1',
  theme: 'light',
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
}))
