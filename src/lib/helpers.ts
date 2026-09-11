import { Check, X } from "lucide-react"
import type { GroupedWatchHistory } from "./watchHistory"

export const formatDurationInMilli = (duration: number): string => {
  const seconds = Math.floor(duration / 1000)
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

export const formatDurationInSeconds = (duration: number): string => {
  const seconds = Math.floor(duration)
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

export const formatNumber = (num: number) => {
  if (num < 1000) {
    return num
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
    deviceId = crypto.randomUUID()
    localStorage.setItem("stream_deviceId", deviceId)
  }
  return deviceId
}

export function mergeGroupedHistory(
  pages: GroupedWatchHistory[][]
): GroupedWatchHistory[] {
  const mergedGroups: GroupedWatchHistory[] = []

  for (const page of pages) {
    for (const group of page) {
      const existingGroup = mergedGroups.find((g) => g.label === group.label)
      if (existingGroup) {
        existingGroup.items.push(...group.items)
      } else {
        mergedGroups.push({ ...group })
      }
    }
  }

  return mergedGroups
}

import { toast, type ToastPosition } from "react-toastify"

export const toastCustom = () => {
  function success(content: string, position: ToastPosition = "bottom-center") {
    toast(content, {
      icon: Check,
      type: "success",
      style: {
        border: "1px solid green",
        backgroundColor: "green",
        color: "white",
      },
      position,
    })
  }

  function error(content: string, position: ToastPosition = "bottom-center") {
    toast(content, {
      icon: X,
      type: "error",
      style: {
        border: "1px solid red",
        backgroundColor: "red",
        color: "white",
      },
      position,
    })
  }

  return { success, error }
}
