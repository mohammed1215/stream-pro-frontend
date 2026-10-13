import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../features/Auth/hooks/useAuth"

export const ProtectedRoute = () => {
  const token = useAuth((s) => s.token)
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
