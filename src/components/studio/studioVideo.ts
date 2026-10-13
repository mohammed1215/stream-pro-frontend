export interface StudioVideo {
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
}

export const fmtViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("en-US")
}
