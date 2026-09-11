import axiosInstance from "./api"

export interface ChannelSummary {
  id: string
  channelImageUrl: string
  title: string
}

export interface VideoSummary {
  id: string
  title: string
  thumbnailUrl: string
  durationSeconds: number
  views: number
  createdAt: string
  channel: ChannelSummary
}

export interface WatchLaterItem {
  id: string
  video: VideoSummary
}

export interface WatchLaterResponse {
  items: WatchLaterItem[]
  videoCount: number
}

export const getWatchLater = async (limit: number, cursor?: string) => {
  const res = await axiosInstance.get<WatchLaterResponse>(
    "/api/v1/watchlaters",
    {
      params: { limit, cursor },
    }
  )
  return res.data
}

export const addToWatchLater = async (videoId: string) => {
  const res = await axiosInstance.post("/api/v1/watchlaters", { videoId })
  return res.data
}

export const removeFromWatchLater = async (videoId: string) => {
  const res = await axiosInstance.delete(`/api/v1/watchlaters/${videoId}`)
  return res.data
}

export const getWatchLaterStatus = async (videoId: string) => {
  const res = await axiosInstance.get<{ isInWatchLater: boolean }>(
    `/api/v1/watchlaters/${videoId}/status`
  )
  return res.data
}
