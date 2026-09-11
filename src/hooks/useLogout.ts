import { useMutation } from "@tanstack/react-query"
import { logoutAllOtherDevices, logoutUser, revokeSession } from "../lib/auth"
import { useNavigate } from "react-router"
import { useAuth } from "../features/Auth/hooks/useAuth"

export const useLogout = () => {
  const navigate = useNavigate()
  const logout = useAuth((state) => state.logout)

  const logoutSingleDeviceMutation = useMutation({
    mutationFn: async () => {
      await logoutUser()
    },
    onSuccess: () => {
      logout()
      navigate("/login")
    },
  })

  const logoutAllOtherDevicesMutation = useMutation({
    mutationFn: async () => {
      await logoutAllOtherDevices()
    },
    onSuccess: () => {
      logout()
      navigate("/login")
    },
  })

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await revokeSession(sessionId)
    },
  })

  return {
    logoutSingleDeviceMutation,
    logoutAllOtherDevicesMutation,
    revokeSessionMutation,
  }
}
