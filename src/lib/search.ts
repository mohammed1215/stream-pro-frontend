import type { PaginatedType } from "../types/paginatedType"
import axiosInstance from "./api"

export interface VideoResponse {
  videoId: string
  title: string
  thumbnailUrl: string | null
  duration: number
  videoUrl: string
  views: number
  channelId: string
  channelName: string
  channelProfileImageUrl: string | null
  updatedAt: string
}

export const searchVideos = async (
  query: string,
  signal: AbortSignal,
  pageNumber: number = 1,
  pageSize: number = 10
) => {
  try {
    const response = await axiosInstance.get<PaginatedType<VideoResponse>>(
      `/api/v1/videos/search`,
      {
        params: { query, pageNumber, pageSize },
        signal,
      }
    )
    return response.data
  } catch (error) {
    console.error("Error searching videos:", error)
    throw error
  }
}
