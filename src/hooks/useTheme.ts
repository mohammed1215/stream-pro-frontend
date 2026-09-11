import { create } from "zustand"

type Theme = "light" | "dark"

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = "stream_theme"

const applyThemeToDOM = (theme: Theme) => {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
}

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light"

  const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (savedTheme === "light" || savedTheme === "dark") {
    applyThemeToDOM(savedTheme)
    return savedTheme
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const systemTheme: Theme = prefersDark ? "dark" : "light"
  applyThemeToDOM(systemTheme)
  return systemTheme
}

export const useTheme = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyThemeToDOM(theme)
    set({ theme })
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === "light" ? "dark" : "light"
      localStorage.setItem(STORAGE_KEY, nextTheme)
      applyThemeToDOM(nextTheme)
      return { theme: nextTheme }
    })
  },
}))
