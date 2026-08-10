import { useEffect, useMemo, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  ListMusic,
  Loader2,
  MessageSquare,
  Users,
} from "lucide-react"

import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

import type {
  NotificationResponse,
  NotificationType,
} from "../lib/notifications"
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../lib/notifications"

type NotificationDropDownProps = {
  isPending: boolean
  notifications?: NotificationResponse[]
  currentPage: number
  totalPages?: number
  hasNextPage?: boolean
  onClose?: () => void
  onNotificationClick?: (notification: NotificationResponse) => void
  onPageChange?: (page: number) => void
}

function getNotificationMeta(type: NotificationType) {
  switch (type) {
    case "LIKE":
      return {
        Icon: Heart,
        className: "border-rose-500/20 bg-rose-500/10 text-rose-500",
        label: "Like",
      }
    case "COMMENT":
      return {
        Icon: MessageSquare,
        className: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        label: "Comment",
      }
    case "PLAYLIST":
      return {
        Icon: ListMusic,
        className: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        label: "Playlist",
      }
    case "SUBSCRIPTION":
      return {
        Icon: Users,
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        label: "Subscription",
      }
    default:
      return {
        Icon: Bell,
        className: "border-border bg-muted text-muted-foreground",
        label: "Notification",
      }
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ""

  const rawSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const seconds = rawSeconds > 0 ? 0 : rawSeconds
  if (Math.abs(seconds) < 5) return "now"

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  const absSeconds = Math.abs(seconds)

  if (absSeconds < 60) return rtf.format(seconds, "second")
  if (absSeconds < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (absSeconds < 86400) return rtf.format(Math.round(seconds / 3600), "hour")
  if (absSeconds < 604800) return rtf.format(Math.round(seconds / 86400), "day")

  const showYear = date.getFullYear() !== new Date().getFullYear()
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(showYear ? { year: "numeric" as const } : {}),
  }).format(date)
}

function NotificationSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <li
          key={`notification-skeleton-${index}`}
          className="px-4 py-3"
          aria-hidden
        >
          <div className="flex animate-pulse items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-4/5 rounded bg-muted" />
              <div className="h-3 w-2/5 rounded bg-muted" />
            </div>
          </div>
        </li>
      ))}
    </>
  )
}

function EmptyNotifications() {
  return (
    <li className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <Bell className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium">No notifications</p>
      <p className="text-xs text-muted-foreground">
        You&apos;re all caught up.
      </p>
    </li>
  )
}

export const NotificationDropDown = ({
  isPending,
  notifications,
  currentPage,
  totalPages,
  hasNextPage,
  onClose,
  onNotificationClick,
  onPageChange,
}: NotificationDropDownProps) => {
  const queryClient = useQueryClient()
  const listRef = useRef<HTMLUListElement>(null)

  // Smoothly scroll to top when page changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentPage])

  const unreadCount = useMemo(
    () =>
      notifications?.filter((notification) => !notification.isRead).length ?? 0,
    [notifications]
  )

  const hasNotifications = Boolean(notifications?.length)

  const {
    mutate: markAsRead,
    isPending: isMarkingAsRead,
    variables: markingAsReadId,
  } = useMutation({
    mutationKey: ["notifications", "markAsRead"],
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMutation({
    mutationKey: ["notifications", "markAllAsRead"],
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const handleNotificationClick = (notification: NotificationResponse) => {
    if (!notification.isRead) {
      markAsRead(notification.notificationId)
    }
    onNotificationClick?.(notification)
    onClose?.()
  }

  return (
    <div
      role="region"
      aria-label="Notifications"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose?.()
      }}
      className={cn(
        "absolute end-0 mt-2 w-80 overflow-hidden rounded-md border border-border",
        "bg-background shadow-lg z-50 animate-pop-up"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Notifications</h2>
        {unreadCount > 0 && (
          <span
            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            aria-live="polite"
          >
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* List */}
      <ul
        ref={listRef}
        aria-busy={isPending}
        className="max-h-96 divide-y divide-border overflow-y-auto overscroll-contain"
      >
        {isPending ? (
          <NotificationSkeleton />
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => {
            const { Icon, className, label } = getNotificationMeta(
              notification.type
            )
            const isMarkingThisNotification =
              isMarkingAsRead && markingAsReadId === notification.notificationId

            return (
              <li key={notification.notificationId}>
                <button
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  disabled={isMarkingThisNotification}
                  aria-label={`${
                    notification.isRead ? "Read" : "Unread"
                  } notification: ${notification.message}`}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left",
                    "transition-colors hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                      className
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>

                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-start gap-2">
                      {!notification.isRead && (
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                      <span
                        className={cn(
                          "line-clamp-2 text-sm",
                          !notification.isRead && "font-medium"
                        )}
                      >
                        {notification.message}
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      <span className="sr-only">{label}: </span>
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </span>

                  {isMarkingThisNotification && (
                    <Loader2
                      className="mt-1 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            )
          })
        ) : (
          <EmptyNotifications />
        )}
      </ul>

      {/* Footer */}
      <div className="flex flex-col border-t border-border">
        {/* Mark all as read */}
        {hasNotifications && (
          <div className="p-2 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2"
              onClick={() => markAllAsRead()}
              disabled={isPending || unreadCount === 0 || isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="h-4 w-4" aria-hidden />
              )}
              {isMarkingAllAsRead ? "Marking..." : "Mark all as read"}
            </Button>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            disabled={isPending || currentPage === 1}
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <span className="text-xs font-medium text-muted-foreground">
            Page {currentPage}
            {totalPages ? ` of ${totalPages}` : ""}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            disabled={isPending || !hasNextPage}
            onClick={() => onPageChange?.(currentPage + 1)}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
