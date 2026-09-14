import axiosInstance from "./api"
export interface FeedResponse {
  id: string
  title?: string
  thumbnailUrl?: string
  durationSeconds?: number
  views?: number
  createdAt?: string
  channelId?: string
  categoryId?: string
  channel?: {
    id?: string
    title?: string
    thumbnailUrl?: string
  }
}
export function getFeed(queryParams?: { excludeIds?: string[] }) {
  return axiosInstance
    .get<FeedResponse[]>("/api/v1/feed", {
      params: {
        excludeIds: queryParams?.excludeIds?.length
          ? queryParams.excludeIds.join(",")
          : undefined,
      },
    })
    .then((res) => res.data)
}
