import { create } from "zustand"

export const THEMES = ["light", "dark", "ocean", "sunset"] as const
export type Theme = (typeof THEMES)[number]

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = "stream_theme"

const applyThemeToDOM = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme)
}

const isValidTheme = (value: string | null): value is Theme =>
  value !== null && THEMES.includes(value as Theme)

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light"

  const savedTheme = localStorage.getItem(STORAGE_KEY)
  if (isValidTheme(savedTheme)) {
    applyThemeToDOM(savedTheme)
    return savedTheme
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const systemTheme: Theme = prefersDark ? "dark" : "light"
  applyThemeToDOM(systemTheme)
  return systemTheme
}

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyThemeToDOM(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const nextTheme: Theme = get().theme === "dark" ? "light" : "dark"
    localStorage.setItem(STORAGE_KEY, nextTheme)
    applyThemeToDOM(nextTheme)
    set({ theme: nextTheme })
  },
}))
