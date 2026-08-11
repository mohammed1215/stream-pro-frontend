export const formatDuration = (duration: number): string => {
  const seconds = Math.floor(duration / 1024)
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
  let deviceId = localStorage.getItem("deviceId")
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem("deviceId", deviceId)
  }
  return deviceId
}
