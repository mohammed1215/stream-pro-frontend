import axiosInstance from "./api"

interface ChannelSummary {
  id: string
  title: string
  channelImageUrl: string
}

interface VideoSummary {
  thumbnailUrl: string
  id: string
  createdAt: string
  channel: ChannelSummary
  title: string
  duration: number
  views: number
}
export interface LikedVideoItem {
  id: string
  createdAt: string
  video: VideoSummary
}

export interface LikedVideosResponse {
  items: LikedVideoItem[]
  videoCount: number
}

export const getLikedVideos = async (limit: number, cursor?: string) => {
  const response = await axiosInstance.get<LikedVideosResponse>(
    `/api/v1/likes`,
    {
      params: {
        limit,
        cursor,
      },
    }
  )
  return response.data
}
