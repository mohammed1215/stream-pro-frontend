import axiosInstance from "./api"

export interface FeedResponse {
  sections: [
    {
      key: string
      title: string
      type: "TRENDING" | "LATEST" | "SUBSCRIPTIONS"
      videos: [
        {
          id: string
          title: string
          thumbnailUrl: string
          duration: number
          views: number
          createdAt: string
          channel: {
            id: string
            title: string
            thumbnailUrl: string
          }
        }
      ]
    }
  ]
}
export function getFeed() {
  return axiosInstance.get<FeedResponse>("/api/v1/feed").then((res) => res.data)
}
