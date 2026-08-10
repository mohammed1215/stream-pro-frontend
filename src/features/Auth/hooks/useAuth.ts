import { useState } from "react"

interface User {
  id: string
  email: string
  name: string
  avatarUrl: string
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user") as string)
      : null
  )
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token") ? localStorage.getItem("token") : null
  )
  const login = (userData: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", token)
    setUser(userData)
    setToken(token)
  }
  return {
    user,
    login,
    token,
  }
}
