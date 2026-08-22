import axiosInstance from "./api"

export interface Playlist {
  playlistId: string
  title: string
  description: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  videoCount: number
  thumbnailUrl: string | null
  firstVideoId: string | null
}

export const getPlaylists = async (): Promise<Playlist[]> => {
  try {
    const response = await axiosInstance.get<Playlist[]>(`/api/v1/playlists`)
    return response.data
  } catch (error) {
    console.error("Error fetching playlists:", error)
    throw error
  }
}

export const createPlaylist = async (playlistData: {
  title: string
  description: string
  isPublic: boolean
}): Promise<{
  message: string
  playlistId: number
  playlistTitle: string
}> => {
  try {
    const response = await axiosInstance.post<{
      message: string
      playlistId: number
      playlistTitle: string
    }>(`/api/v1/playlists`, playlistData)
    return response.data
  } catch (error) {
    console.error("Error creating playlist:", error)
    throw error
  }
}

export const addVideoToPlaylist = async ({
  playlistId,
  videoId,
}: {
  playlistId: string
  videoId: string
}) => {
  try {
    const response = await axiosInstance.post(
      `/api/v1/playlists/${playlistId}/videos/${videoId}`,
      { videoId }
    )
    return response.data
  } catch (error) {
    console.error("Error adding video to playlist:", error)
    throw error
  }
}

export const removeVideoFromPlaylist = async ({
  playlistId,
  videoId,
}: {
  playlistId: string
  videoId: string
}) => {
  try {
    const response = await axiosInstance.delete(
      `/api/v1/playlists/${playlistId}/videos/${videoId}`
    )
    return response.data
  } catch (error) {
    console.error("Error removing video from playlist:", error)
    throw error
  }
}

export interface VideoOfPlaylist {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string | null
  indexOfVideo: number
  playlistId: string
  createdAt: string
}

export interface PaginatedType2<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
}

export const getVideosInPlaylist = async (playlistId: string) => {
  try {
    const response = await axiosInstance.get<
      PaginatedType2<VideoOfPlaylist & { duration: number }> & {
        isPublic: boolean
      }
    >(`/api/v1/playlists/${playlistId}/videos`)
    return response.data
  } catch (error) {
    console.error("Error fetching videos in playlist:", error)
    throw error
  }
}

export const getPlaylistsWithHasVideo = async (
  videoId: string
): Promise<(Playlist & { hasVideo: boolean })[]> => {
  try {
    const response = await axiosInstance.get<
      (Playlist & { hasVideo: boolean })[]
    >(`/api/v1/playlists/video/${videoId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching playlists with video:", error)
    throw error
  }
}

export interface PlaylistItemDto {
  videoId: string
  title: string
  thumbnailUrl: string
  duration: number
  views: number
  createdAt: Date
  channelId: string
  channelTitle: string
  channelImageUrl: string | null
}

export interface PlaylistDetailsDto {
  playlistId: string
  title: string
  description: string | null
  isPublic: boolean
  videoCount: number
  items: PlaylistItemDto[]
}

export const getPlaylistDetails = async (
  playlistId: string,
  params: { cursor?: string; limit?: number }
) => {
  try {
    const response = await axiosInstance.get<PlaylistDetailsDto>(
      `/api/v1/playlists/${playlistId}`,
      { params }
    )
    return response.data
  } catch (error) {
    console.error("Error fetching playlist details:", error)
    throw error
  }
}
