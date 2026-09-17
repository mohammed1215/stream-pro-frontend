import axios from "axios"
import axiosInstance from "./api"

export interface VideoDetailResponse {
  videoId: string
  title: string
  videoUrl: string | null
  hlsUrl: string | null
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
  categoryId: string | null
  tags: { id: string; name: string }[]
  publishTime: string | null
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

export const ownerVideoDetails = async (videoId: string) => {
  try {
    const video = (
      await axiosInstance.get<VideoDetailResponse>(
        `/api/v1/owner/videos/${videoId}`
      )
    ).data
    return video
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const createVideoApi = async ({
  title,
  description,
  categoryId,
  onUploadProgress,
}: {
  title: string
  description: string
  categoryId: string
  onUploadProgress?: (percent: number) => void
}) => {
  const res = await axiosInstance.postForm(
    `/api/v1/owner/videos`,
    {
      title,
      description,
      categoryId,
    },
    {
      onUploadProgress: (progressEvent) => {
        console.log("Upload progress:", progressEvent.progress)
        if (typeof progressEvent.progress === "number") {
          onUploadProgress?.(Math.round(progressEvent.progress * 100))
        }
      },
    }
  )
  return res.data
}
export interface VideoUploadSignature {
  uploadUrl: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  eager?: string
  eagerAsync?: boolean
  eagerNotificationUrl?: string
}

export interface InitVideoResponse {
  success: boolean
  data: {
    videoId: string
    signatureVideoData: {
      signature: string
      timestamp: number
      apiKey: string
      folder: string
      eager: string
      eager_notification_url: string
      eager_async: boolean
      uploadUrl: string
      public_id: string
    }
    signatureThumbnailData: {
      timestamp: number
      folder: string
      public_id: string
      transformation: string
      signature: string
      apiKey: string
      uploadUrl: string
    }
  }
}

export const initiateVideoUploadApi = async (payload: {
  title: string
  description: string
  tags: string[]
  categoryId: string
  publishTime?: Date
}): Promise<InitVideoResponse> => {
  const res = await axiosInstance.post<InitVideoResponse>(
    "/api/v1/owner/videos/initiate",
    payload
  )
  return res.data
}

export const uploadVideoToCloudApi = async ({
  uploadUrl,
  formData,
  onProgress,
  signal,
}: {
  uploadUrl: string
  formData: FormData
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}) => {
  const res = await axios.post(uploadUrl, formData, {
    signal,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress?.(percent)
      }
    },
  })
  return res.data
}
export const uploadThumbnailToCloudApi = async ({
  uploadUrl,
  formData,
  onProgress,
  signal,
}: {
  uploadUrl: string
  formData: FormData
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}) => {
  const res = await axios.post(uploadUrl, formData, {
    signal,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress?.(percent)
      }
    },
  })
  return res.data
}

export const confirmUploadThumbnailApi = async (
  videoId: string,
  payload: {
    publicId: string
    version: number
    signature: string
    thumbnailUrl: string
  }
) => {
  const res = await axiosInstance.post(
    `/api/v1/owner/videos/${videoId}/thumbnail-upload-completed`,
    payload
  )
  return res.data
}

export const confirmUploadVideoApi = async (
  videoId: string,
  payload: {
    publicId: string
    version: number
    signature: string
    duration: number
    bytes: number
  }
) => {
  const res = await axiosInstance.post(
    `/api/v1/owner/videos/${videoId}/video-upload-completed`,
    payload
  )
  return res.data
}

export const deleteVideo = async (videoId: string) => {
  const res = await axiosInstance.delete(`/api/v1/owner/videos/${videoId}`)
  return res.data
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
    durationSeconds: number
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
  sortBy,
}: {
  page: number
  limit: number
  query?: string
  status?: "ALL" | "PUBLISHED" | "UNPUBLISHED"
  sortBy?: "NEWEST" | "OLDEST" | "MOST_VIEWED"
}) => {
  try {
    const res = await axiosInstance.get<FetchOwnerVideosChannelResponse>(
      `/api/v1/owner/videos`,
      {
        params: {
          page,
          limit,
          ...(query && { query }),
          ...(status !== "ALL" && { status }),
          ...(sortBy && { sortBy }),
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

export interface UpdateVideoDetailsPayload {
  title: string
  description: string
  categoryId?: string | null
  tags?: string[]
  publishTime?: string | null
}

export const updateVideoDetails = async (
  videoId: string,
  payload: UpdateVideoDetailsPayload
) => {
  const res = await axiosInstance.patch(
    `/api/v1/owner/videos/${videoId}`,
    payload
  )
  return res.data
}

export const getVideoThumbnailSignatureApi = async (videoId: string) => {
  const res = await axiosInstance.patch<{
    timestamp: number
    folder: string
    public_id: string
    transformation: string
    signature: string
    apiKey: string
    uploadUrl: string
  }>(`/api/v1/owner/videos/${videoId}/thumbnail/signature`)
  return res.data
}

export const getVideoMediaSignatureApi = async (videoId: string) => {
  const res = await axiosInstance.patch<{
    signature: string
    timestamp: number
    apiKey: string
    folder: string
    eager: string
    eager_notification_url: string
    eager_async: boolean
    uploadUrl: string
    public_id: string
  }>(`/api/v1/owner/videos/${videoId}/media/signature`)
  return res.data
}

export const updateVideoThumbnailApi = async (
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

export const recordViewApi = async (videoId: string) => {
  const res = await axiosInstance.post(`/api/v1/videos/${videoId}/views`)
  return res.data
}
export interface VideoResponseDto {
  videoId: string
  title: string
  videoUrl: string | null
  hlsUrl: string | null
  thumbnailUrl: string | null
  channelId: string
  channelTitle: string
  channelImageUrl: string | null
  durationSeconds: number
  views: number
}
export const fetchRelatedVideosApi = async (videoId: string) => {
  const res = await axiosInstance.get<VideoResponseDto[]>(
    `/api/v1/videos/${videoId}/related`
  )
  return res.data
}
