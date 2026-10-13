import type { VideoCardVideo } from "../components/HomeVideoCard"

interface RawChannelVideo {
  videoId?: string
  id?: string
  videoTitle?: string
  title?: string
  thumbnailUrl?: string
  duration?: number
  views?: number
  createdAt?: string
  channelId?: string
  channelTitle?: string
  channelThumbnailUrl?: string
  channel?: { id?: string; title?: string; thumbnailUrl?: string }
}

export const normalizeChannelVideo = (raw: RawChannelVideo): VideoCardVideo => ({
  id: raw.videoId ?? raw.id,
  title: raw.videoTitle ?? raw.title,
  thumbnailUrl: raw.thumbnailUrl,
  duration: raw.duration,
  views: raw.views,
  createdAt: raw.createdAt,
  channel: {
    id: raw.channelId ?? raw.channel?.id,
    title: raw.channelTitle ?? raw.channel?.title,
    thumbnailUrl: raw.channelThumbnailUrl ?? raw.channel?.thumbnailUrl,
  },
})
