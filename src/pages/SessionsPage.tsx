import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "../lib/api"
import { useLogout } from "../hooks/useLogout"
import { getDeviceId } from "../lib/helpers"
import dayjs from "../lib/dayjs"
import {
  Globe,
  MapPin,
  Monitor,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

export interface Session {
  id: string
  deviceId: string | null
  deviceType: string | null
  deviceToken: string | null
  deviceName: string | null
  userAgent: string | null
  city: string | null
  country: string | null
  createdIp: string | null
  lastIp: string | null
  appVersion: string | null
  loginMethod: string | null
  isRevoked: boolean
  revokedAt: string | null
  revokedReason: string | null
  replacedByHash: string | null
  lastUsedAt: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
  userId: string
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

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  const cls = "w-5 h-5"
  switch (deviceType) {
    case "ANDROID":
    case "IOS":
      return <Smartphone className={cls} />
    case "WEB":
      return <Monitor className={cls} />
    default:
      return <Globe className={cls} />
  }
}

function isExpired(session: Session) {
  return new Date(session.expiresAt).getTime() <= Date.now()
}

function SessionStatusBadge({ session }: { session: Session }) {
  if (session.isRevoked) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground ring-1 ring-border">
        Revoked
      </span>
    )
  }
  if (isExpired(session)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground ring-1 ring-border">
        Expired
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-bg)] text-accent-foreground ring-1 ring-[var(--accent-border)]">
      Active now
    </span>
  )
}

function formatLocation(session: Session) {
  const parts = [session.city, session.country].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

function SessionMeta({ session }: { session: Session }) {
  const location = formatLocation(session)
  const ip = session.lastIp ?? session.createdIp
  const lastActive = session.lastUsedAt ?? session.updatedAt
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {location && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {location}
        </span>
      )}
      {ip && <span className="font-mono">{ip}</span>}
      {session.appVersion && <span>v{session.appVersion}</span>}
      {session.loginMethod && (
        <span className="inline-flex items-center gap-1 capitalize">
          <ShieldCheck className="w-3.5 h-3.5" />
          {session.loginMethod.toLowerCase()}
        </span>
      )}
      <span>Active {dayjs(lastActive).fromNow()}</span>
    </div>
  )
}

export const SessionsPage = () => {
  const queryClient = useQueryClient()
  const {
    logoutAllOtherDevicesMutation,
    logoutSingleDeviceMutation,
    revokeSessionMutation,
  } = useLogout()

  const {
    data: sessions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await axiosInstance.get<SessionsResponse>(
        "/api/v1/sessions"
      )
      return response.data.data
    },
  })

  const refreshSessions = () =>
    queryClient.invalidateQueries({ queryKey: ["sessions"] })

  const currentDeviceId = getDeviceId()

  const currentSession =
    sessions?.find((s) => s.deviceId === currentDeviceId) || sessions?.[0]
  const otherSessions = sessions?.filter((s) => s.id !== currentSession?.id)

  const mutationBusy =
    logoutSingleDeviceMutation?.isPending ||
    logoutAllOtherDevicesMutation.isPending ||
    revokeSessionMutation.isPending

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto p-6 space-y-8 text-foreground"
    >
      {/* 🏷️ Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Sessions
        </h2>
        <p className="text-sm text-muted-foreground">
          These are the devices currently signed in to your account. If you
          don&apos;t recognize one, sign it out.
        </p>
      </motion.div>

      {/* ⏳ Loading State */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-20 bg-muted/60 rounded-xl" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-36 bg-muted/60 rounded-xl" />
        </div>
      ) : isError ? (
        <p className="p-6 text-center text-sm text-destructive">
          Couldn&apos;t load sessions. Please try again.
        </p>
      ) : (
        <>
          {/* 🟢 Current Device */}
          {currentSession && (
            <motion.div variants={itemVariants} className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                This device
              </span>
              <div className="p-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {currentSession.deviceName ??
                          currentSession.deviceType ??
                          "Current Browser"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Signed in{" "}
                        {dayjs(currentSession.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                  </div>
                  <SessionStatusBadge session={currentSession} />
                </div>
                <SessionMeta session={currentSession} />
              </div>
            </motion.div>
          )}

          {/* 📱 Other Devices */}
          <motion.div variants={itemVariants} className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Other signed-in devices ({otherSessions?.length ?? 0})
            </span>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
              <AnimatePresence initial={false} mode="popLayout">
                {otherSessions?.map((session) => {
                  const inactive = session.isRevoked || isExpired(session)
                  return (
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
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                      className="p-4 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
                            <DeviceIcon deviceType={session.deviceType} />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-foreground">
                              {session.deviceName ??
                                session.deviceType ??
                                "Unknown Device"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Signed in{" "}
                              {dayjs(session.createdAt).format("MMM D, YYYY")}
                            </p>
                          </div>
                        </div>

                        {inactive ? (
                          <SessionStatusBadge session={session} />
                        ) : (
                          <button
                            type="button"
                            disabled={mutationBusy}
                            onClick={() =>
                              revokeSessionMutation.mutate(session.id, {
                                onSuccess: refreshSessions,
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Sign out
                          </button>
                        )}
                      </div>
                      <SessionMeta session={session} />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {otherSessions?.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No other active sessions.
                </p>
              )}
            </div>
          </motion.div>

          {/* 🚪 Sign Out All */}
          <motion.div
            variants={itemVariants}
            className="pt-2 border-t border-border"
          >
            <button
              type="button"
              disabled={mutationBusy || otherSessions?.length === 0}
              onClick={() =>
                logoutAllOtherDevicesMutation.mutate(undefined, {
                  onSuccess: refreshSessions,
                })
              }
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
