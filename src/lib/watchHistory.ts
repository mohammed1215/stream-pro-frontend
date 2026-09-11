import axiosInstance from "./api"

export interface VideoSummary {
  id: string
  title: string
  thumbnailUrl: string
  durationSeconds: number
}

export interface ChannelSummary {
  id: string
  title: string
  channelImageUrl: string | null
}

export interface WatchHistoryItem {
  id: string
  watchedSeconds: number
  videoDuration: number
  completionRate: number
  lastWatchedAt: string
  video: VideoSummary
  channel: ChannelSummary
}

export interface GroupedWatchHistory {
  label: string
  items: WatchHistoryItem[]
}

export type WatchHistoryResponse = GroupedWatchHistory[]

export const getHistory = async (
  cursor?: string,
  limit = 20
): Promise<WatchHistoryResponse> => {
  const res = await axiosInstance.get<WatchHistoryResponse>(
    "/api/v1/watch-history",
    {
      params: { cursor, limit },
    }
  )
  return res.data
}

export const trackProgress = async (
  videoId: string,
  watchedSeconds: number
) => {
  const res = await axiosInstance.post("/api/v1/watch-history/track", {
    videoId,
    watchedSeconds,
  })
  return res.data
}
