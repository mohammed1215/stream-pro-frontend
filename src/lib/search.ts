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

export async function searchVideos(
  query: string,
  pageNumber: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<VideoResponse> {
  const response = await axiosInstance.get("/api/v1/videos/search", {
    params: {
      query,
      pageNumber,
      pageSize,
    },
    signal,
  })

  return response.data
}
