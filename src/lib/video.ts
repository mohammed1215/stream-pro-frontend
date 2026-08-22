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
  isPublished: boolean
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

export interface FetchOwnerVideosChannelResponse {
  items: {
    videoId: string
    title: string
    videoUrl: string
    thumbnailUrl: string
    channelId: string
    channelTitle: string
    channelImageUrl: string
    duration: number
    views: number
    isPublished: boolean
  }[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
}

export const fetchOwnerVideosChannel = async ({
  page,
  limit,
  query,
  status,
  sort,
}: {
  page: number
  limit: number
  query?: string
  status?: string
  sort?: string
}) => {
  try {
    const res = await axiosInstance.get<FetchOwnerVideosChannelResponse>(
      `/api/v1/owner/channel/videos`,
      {
        params: {
          page,
          limit,
          ...(query && { query }),
          ...(status !== "all" && { status }),
          ...(sort && { sort }),
        },
      }
    )
    return res.data
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const updateVideoStatus = async (videoId: string) => {
  const res = await axiosInstance.patch(
    `/api/v1/owner/videos/${videoId}/change-publish-status`
  )
  return res.data
}

export const updateVideoDetails = async (
  videoId: string,
  {
    title,
    description,
  }: {
    title: string
    description: string
  }
) => {
  const res = await axiosInstance.patch(`/api/v1/owner/videos/${videoId}`, {
    title,
    description,
  })
  return res.data
}

export const updateVideoThumbnail = async (
  videoId: string,
  thumbnailFile: File
) => {
  const videoThumbnailFormData = new FormData()
  videoThumbnailFormData.append("thumbnail", thumbnailFile)
  const res = await axiosInstance.patch(
    `/api/v1/owner/videos/${videoId}/thumbnail`,
    videoThumbnailFormData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  return res.data
}

export const uploadVideoMedia = async (videoId: string, videoFile: File) => {
  const videoMediaFormData = new FormData()
  debugger
  videoMediaFormData.append("video", videoFile)
  const res = await axiosInstance.patch(
    `/api/v1/owner/videos/${videoId}/media`,
    videoMediaFormData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  return res.data
}
