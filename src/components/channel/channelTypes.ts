import type {
  FetchChannelPlaylistsResponse,
  FetchChannelVideosResponse,
} from "../../lib/channel"

export interface ChannelData {
  title: string
  description?: string
  thumbnailUrl?: string
  channelImageUrl: string
  subscriptionsCount: number
  videosCount: number
  totalViews: number
  isSubscribed: boolean
  isOwner: boolean
  createdAt: string
}

export type VideoType = FetchChannelVideosResponse["items"][0]
export type PlaylistType = FetchChannelPlaylistsResponse["items"][0]
