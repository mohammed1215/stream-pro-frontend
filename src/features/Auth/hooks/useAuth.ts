import { create } from "zustand"

interface User {
  id: string
  email: string
  name: string
  avatarUrl: string
}

interface AuthState {
  user: User | null
  token: string | null
  login: (userData: User, token: string) => void
  logout: () => void
}

const getStoredUser = (): User | null => {
  const raw = localStorage.getItem("stream_user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const useAuth = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem("stream_token"),

  login: (userData, token) => {
    localStorage.setItem("stream_user", JSON.stringify(userData))
    localStorage.setItem("stream_token", token)
    set({ user: userData, token })
  },

  logout: () => {
    localStorage.removeItem("stream_user")
    localStorage.removeItem("stream_token")
    set({ user: null, token: null })
  },
}))
