import "./App.css"
import { Outlet } from "react-router-dom"
import { useEffect } from "react"
import { router } from "./router"
import { useAuth } from "./features/Auth/hooks/useAuth"
import { queryClient } from "./lib/queryClient"

function App() {
  useEffect(() => {
    const handleSessionExpired = () => {
      // Fully log out: clear stored user/token and cached queries,
      // otherwise the UI keeps showing the user as logged in.
      useAuth.getState().logout()
      queryClient.clear()
      router.navigate("/login")
    }
    window.addEventListener("auth:session-expired", handleSessionExpired)
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired)
  }, [])

  return (
    <>
      <Outlet />
    </>
  )
}

export default App
