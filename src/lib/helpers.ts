import type { NotificationResponse } from "./notifications"
import type { GroupedWatchHistory } from "./watchHistory"

export const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  if (seconds < 60) {
    return `00:${seconds < 10 ? `0${seconds}` : seconds}`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 60) {
    return `${minutes < 10 ? `0${minutes}` : minutes}:${
      remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds
    }`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}:${
    remainingMinutes < 10 ? `0${remainingMinutes}` : remainingMinutes
  }:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`
}

// Backward-compatible wrappers. Prefer `formatDuration(seconds)` in new code.
export const formatDurationInMilli = (durationMs: number): string =>
  formatDuration(durationMs / 1000)

export const formatDurationInSeconds = (durationSeconds: number): string =>
  formatDuration(durationSeconds)

export const formatNumber = (num: number): string => {
  if (num < 1000) {
    return `${num}`
  }
  if (num < 1000000) {
    return `${Math.floor(num / 1000)}K`
  }
  if (num < 1000000000) {
    return `${Math.floor(num / 1000000)}M`
  }
  if (num < 1000000000000) {
    return `${Math.floor(num / 1000000000000)}B`
  }
  return `${Math.floor(num / 1000000000000000)}T`
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem("stream_deviceId")
  if (!deviceId) {
    deviceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem("stream_deviceId", deviceId)
  }
  return deviceId
}

const ENCODED_PATTERN = /%(?:[0-9A-Fa-f]{2})/

/**
 * Safely decodes a possibly percent-encoded string (e.g. search terms that
 * were stored encoded). Repeats up to `maxPasses` for double-encoded input.
 * Returns the original string when decoding fails or changes nothing, so a
 * literal "%" in user text never breaks rendering.
 */
export function safeDecode(value: string, maxPasses = 2): string {
  if (!value || !ENCODED_PATTERN.test(value)) return value
  let current = value
  for (let i = 0; i < maxPasses; i++) {
    if (!ENCODED_PATTERN.test(current)) break
    try {
      const next = decodeURIComponent(current)
      if (next === current) break
      current = next
    } catch {
      break
    }
  }
  return current
}

export function mergeGroupedHistory(
  pages: GroupedWatchHistory[][]
): GroupedWatchHistory[] {
  const mergedByLabel = new Map<string, GroupedWatchHistory>()

  for (const page of pages) {
    for (const group of page) {
      const existingGroup = mergedByLabel.get(group.label)
      if (existingGroup) {
        existingGroup.items.push(...group.items)
      } else {
        mergedByLabel.set(group.label, { ...group, items: [...group.items] })
      }
    }
  }

  return [...mergedByLabel.values()]
}

export function getRouteForNotification(
  notification: NotificationResponse
): string | null {
  switch (notification.type) {
    case "PLAYLIST":
      // Router defines `/playlist` (singular, no :id — uses ?list=).
      // See src/router.tsx and PlaylistPage query-param handling.
      return `/playlist?list=${notification.playlistId}`
    case "REPLY":
      return `/videos/${notification.videoId}?commentId=${notification.commentId}`
    case "SUBSCRIPTION":
      return `/channels/${notification.channelId}`
    case "COMMENT":
      return `/videos/${notification.videoId}?commentId=${notification.commentId}`
    case "LIKE":
      return `/feed/liked`
    default:
      return null
  }
}
