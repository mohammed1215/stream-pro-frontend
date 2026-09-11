import { motion, AnimatePresence } from "framer-motion"
import { MobileIcon } from "@vidstack/react/icons"
import { useQuery } from "@tanstack/react-query"
import axiosInstance from "../lib/api"
import { useLogout } from "../hooks/useLogout"
import dayjs from "dayjs"

export interface Session {
  id: string
  tokenHash: string
  userId: string
  deviceId: string
  deviceType: string
  deviceToken: string
  isRevoked: boolean
  expiresAt: string
  createdAt: string
  updatedAt: string
  lastUsedAt: string
}

export interface SessionsResponse {
  success: boolean
  data: Session[]
  meta: Record<string, unknown>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
}

export const SessionsPage = () => {
  const {
    logoutAllOtherDevicesMutation,
    logoutSingleDeviceMutation,
    revokeSessionMutation,
  } = useLogout()

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await axiosInstance.get<SessionsResponse>(
        "/api/v1/sessions"
      )
      return response.data.data
    },
  })

  const currentDeviceId =
    typeof window !== "undefined" ? localStorage.getItem("deviceId") : null

  const currentSession =
    sessions?.find((s) => s.deviceId === currentDeviceId) || sessions?.[0]
  const otherSessions = sessions?.filter((s) => s.id !== currentSession?.id)

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto p-6 space-y-8"
    >
      {/* 🏷️ Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Sessions
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          These are the devices currently signed in to your account. If you
          don't recognize one, sign it out.
        </p>
      </motion.div>

      {/* ⏳ Loading State */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-20 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-36 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
        </div>
      ) : (
        <>
          {/* 🟢 Current Device */}
          {currentSession && (
            <motion.div variants={itemVariants} className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                This device
              </span>
              <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10">
                <div className="flex items-center gap-3.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                      {currentSession.deviceType || "Current Browser"}
                    </h3>
                    {currentSession.lastUsedAt && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {dayjs(
                          currentSession.lastUsedAt ?? currentSession.updatedAt
                        ).fromNow()}
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Active now
                </span>
              </div>
            </motion.div>
          )}

          {/* 📱 Other Devices */}
          <motion.div variants={itemVariants} className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Other signed-in devices ({otherSessions?.length})
            </span>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
              <AnimatePresence initial={false} mode="popLayout">
                {otherSessions?.map((session) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{
                      opacity: 0,
                      x: -30,
                      height: 0,
                      transition: { duration: 0.25 },
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="flex items-center justify-between p-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        <MobileIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
                          {session.deviceType || "Unknown Device"}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {dayjs(
                            session.lastUsedAt ?? session.updatedAt
                          ).fromNow()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        logoutSingleDeviceMutation?.isPending ||
                        logoutAllOtherDevicesMutation.isPending ||
                        revokeSessionMutation.isPending
                      }
                      onClick={() => revokeSessionMutation.mutate(session.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sign out
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {otherSessions?.length === 0 && (
                <p className="p-6 text-center text-sm text-zinc-400">
                  No other active sessions.
                </p>
              )}
            </div>
          </motion.div>

          {/* 🚪 Sign Out All */}
          <motion.div
            variants={itemVariants}
            className="pt-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <button
              type="button"
              disabled={
                logoutAllOtherDevicesMutation.isPending ||
                otherSessions?.length === 0 ||
                logoutSingleDeviceMutation?.isPending ||
                revokeSessionMutation.isPending
              }
              onClick={() => logoutAllOtherDevicesMutation.mutate()}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logoutAllOtherDevicesMutation.isPending ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-current"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span>Signing out...</span>
                </>
              ) : (
                "Sign out all other devices"
              )}
            </button>
          </motion.div>
        </>
      )}
    </motion.section>
  )
}
