import axiosInstance from "./api"

export interface VideoDetailResponse {
  videoId: string
  title: string
  videoUrl: string
  thumbnailUrl: string
  channelId: string
  channelTitle: string
  channelImageUrl: string | null
  duration: number
  views: number
  description: string
  commentsCount: number
  likesCount: number
  channelSubscribersCount: number
  isSubscribed: boolean | null
  isLiked: boolean | null
  createdAt: string
}

export const videoDetails = async (videoId: string) => {
  try {
    const video = (
      await axiosInstance.get<VideoDetailResponse>(`/api/v1/videos/${videoId}`)
    ).data
    return video
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const likeVideo = async (videoId: string) => {
  try {
    const res = await axiosInstance.post(`/api/v1/likes/${videoId}`)
    return res.data
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const unLikeVideo = async (videoId: string) => {
  try {
    const res = await axiosInstance.delete(`/api/v1/likes/${videoId}`)
    return res.data
  } catch (error) {
    console.log(error)
    throw error
  }
}
