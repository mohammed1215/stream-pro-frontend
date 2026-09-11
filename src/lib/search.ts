import axiosInstance from "./api"

export interface VideoResponse {
  videoId: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number
  videoUrl: string
  views: number
  channelId: string
  channelName: string
  channelProfileImageUrl: string | null
  updatedAt: string
}

export interface SearchResponse {
  items: VideoResponse[]
  pageSize: number
  pageNumber: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
}

export async function searchVideos(
  query: string,
  pageNumber: number,
  pageSize: number,
  category?: string,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    query,
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    ...(category ? { category } : {}),
  })

  const response = await axiosInstance.get(
    `/api/v1/videos/search?${params.toString()}`,
    { signal }
  )

  return response.data
}
