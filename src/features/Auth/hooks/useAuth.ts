import { create } from "zustand"

interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
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

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem("stream_token")
  } catch {
    return null
  }
}

const storedUser = getStoredUser()
const storedToken = getStoredToken()

export const useAuth = create<AuthState>((set) => ({
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedUser && storedToken),

  login: (userData, token) => {
    localStorage.setItem("stream_user", JSON.stringify(userData))
    localStorage.setItem("stream_token", token)
    set({ user: userData, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("stream_user")
    localStorage.removeItem("stream_token")
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
