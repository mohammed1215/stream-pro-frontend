export interface RelatedVideo {
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
