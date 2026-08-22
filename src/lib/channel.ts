import axiosInstance from "./api"

export interface FetchChannelDataResponse {
  channelId: string
  title: string
  description: string
  thumbnailUrl: string
  channelImageUrl: string
  videosCount: number
  subscriptionsCount: number
  totalViews: number
  isSubscribed: boolean
  isOwner: boolean
  createdAt: string
  updatedAt: string
}

export const fetchChannelData = async (
  channelId: string,
  signal?: AbortSignal
) => {
  const res = await axiosInstance.get<FetchChannelDataResponse>(
    `/api/v1/channels/${channelId}`,
    { signal }
  )
  return res.data
}

export interface FetchChannelVideosResponse {
  items: [
    {
      videoId: string
      videoTitle: string
      videoDescription: string
      videoUrl: string
      thumbnailUrl: string
      views: number
      createdAt: string
      updatedAt: string
      isLikedByUser: boolean
      isInWatchLater: boolean
    }
  ]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
}

export const fetchChannelVideos = async (
  channelId: string,
  params?: {
    pageNumber?: number
    pageSize?: number
  },
  signal?: AbortSignal
) => {
  const res = await axiosInstance.get<FetchChannelVideosResponse>(
    `/api/v1/channels/${channelId}/videos`,
    { signal, params }
  )
  return res.data
}

export interface FetchChannelPlaylistsResponse {
  items: [
    {
      id: string
      title: string
      description: string
      createdAt: string
      updatedAt: string
      isPublic: boolean
      videosCount: number
    }
  ]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
}

export const fetchChannelPlaylists = async (
  channelId: string,
  params?: {
    pageNumber?: number
    pageSize?: number
  },
  signal?: AbortSignal
) => {
  const res = await axiosInstance.get<FetchChannelPlaylistsResponse>(
    `/api/v1/channels/${channelId}/playlists`,
    { signal, params }
  )
  return res.data
}

export interface FetchChannelHomeResponse {
  videos: FetchChannelVideosResponse["items"]
  playlists: FetchChannelPlaylistsResponse["items"]
}

export const fetchChannelHome = async (
  channelId: string,
  signal?: AbortSignal
) => {
  const res = await axiosInstance.get<FetchChannelHomeResponse>(
    `/api/v1/channels/${channelId}/home`,
    {
      signal,
    }
  )
  return res.data
}
