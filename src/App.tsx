import "./App.css"
import { Outlet } from "react-router-dom"
import { useEffect } from "react"
import { router } from "./router"

function App() {
  useEffect(() => {
    const handleSessionExpired = () => {
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
