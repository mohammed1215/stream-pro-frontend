import { useMutation, useQueryClient } from "@tanstack/react-query"
import { logoutAllOtherDevices, logoutUser, revokeSession } from "../lib/auth"
import { setLoggingOut } from "../lib/api"
import { useNavigate } from "react-router"
import { useAuth } from "../features/Auth/hooks/useAuth"

export const useLogout = () => {
  const navigate = useNavigate()
  const logout = useAuth((state) => state.logout)
  const queryClient = useQueryClient()

  // Local logout always runs — even if the server session is already gone
  // (expired / revoked), the user still ends up logged out, silently.
  const handleLocalLogout = () => {
    logout()
    queryClient.clear()
    navigate("/login")
  }

  // Silence the axios 401 -> refresh -> toast/session-expired chain for the
  // logout request itself and any racing background requests.
  const runLogoutRequest = async (request: () => Promise<void>) => {
    setLoggingOut(true)
    // Stop background refetches from racing the logout request.
    await queryClient.cancelQueries()
    try {
      await request()
    } finally {
      setLoggingOut(false)
    }
  }

  const logoutSingleDeviceMutation = useMutation({
    mutationFn: () => runLogoutRequest(logoutUser),
    onSuccess: handleLocalLogout,
    // Server already considers the session dead (401/400): still log out
    // locally instead of leaving the user stuck, and stay silent.
    onError: handleLocalLogout,
  })

  const logoutAllOtherDevicesMutation = useMutation({
    mutationFn: () => runLogoutRequest(logoutAllOtherDevices),
    onSuccess: handleLocalLogout,
    onError: handleLocalLogout,
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
