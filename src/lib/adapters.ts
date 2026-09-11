import type { VideoCardVideo } from "../components/HomeVideoCard"

export const normalizeChannelVideo = (raw: any): VideoCardVideo => ({
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
