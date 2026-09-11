import { Link } from "react-router-dom"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { motion, type Variants } from "framer-motion"
import { Play } from "lucide-react"
import { formatDurationInSeconds, formatNumber } from "../lib/helpers"
import { VideoActionMenu } from "./VideoActionMenu"

dayjs.extend(relativeTime)

export type VideoCardVideo = {
  id?: string
  title?: string
  thumbnailUrl?: string
  durationSeconds?: number
  views?: number
  createdAt?: string
  channel?: {
    id?: string
    title?: string
    thumbnailUrl?: string
  }
}

type VideoCardProps = {
  video: VideoCardVideo
  isOwner?: boolean
  onEdit?: (video: VideoCardVideo) => void
  onDelete?: (videoId: string) => void
}

export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 1, 0.5, 1],
    },
  },
}

export const HomeVideoCard = ({
  video,
  isOwner,
  onEdit,
  onDelete,
}: VideoCardProps) => {
  const views = typeof video.views === "number" ? video.views : null

  const meta = [
    views !== null
      ? `${formatNumber(views)} ${views === 1 ? "view" : "views"}`
      : null,
    video.createdAt ? dayjs(video.createdAt).fromNow() : null,
  ]
    .filter(Boolean)
    .join(" • ")

  return (
    <motion.div
      variants={cardItemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative flex flex-col"
    >
      {/* 1. Thumbnail Link */}
      <Link
        to={video.id ? `/videos/${video.id}` : "#"}
        onClick={(e) => !video.id && e.preventDefault()}
        className="flex flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={video.title ?? "Watch video"}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border/50">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title ?? "Video thumbnail"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/60 text-xs font-medium text-muted-foreground">
              No preview available
            </div>
          )}

          {/* Hover Play Button */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Play className="h-5 w-5 fill-current translate-x-0.5" />
            </div>
          </div>

          {/* Duration Badge */}
          {video.durationSeconds ? (
            <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white shadow-sm backdrop-blur-md">
              {formatDurationInSeconds(video.durationSeconds)}
            </span>
          ) : null}
        </div>
      </Link>

      {/* 2. Video Meta Bar */}
      <div className="flex gap-3 pt-3">
        {/* Channel Avatar */}
        <Link
          to={video.channel?.id ? `/channels/${video.channel.id}` : "#"}
          onClick={(e) => !video.channel?.id && e.preventDefault()}
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/60 transition-transform hover:scale-105"
        >
          {video.channel?.thumbnailUrl ? (
            <img
              src={video.channel.thumbnailUrl}
              alt={video.channel.title ?? "Channel avatar"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-muted-foreground">
              {video.channel?.title?.[0] ?? "V"}
            </div>
          )}
        </Link>

        {/* Title, Details, & Menu */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <Link
              to={video.id ? `/videos/${video.id}` : "#"}
              onClick={(e) => !video.id && e.preventDefault()}
              className="min-w-0 flex-1"
            >
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {video.title ?? "Untitled video"}
              </h3>
            </Link>

            {/* Fixed Action Menu Trigger */}
            {video.id && (
              <div className="relative shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                <VideoActionMenu
                  video={{
                    id: video.id,
                    title: video.title,
                    thumbnailUrl: video.thumbnailUrl,
                  }}
                  isOwner={isOwner}
                  onEdit={() => onEdit?.(video)}
                  onDelete={onDelete}
                />
              </div>
            )}
          </div>

          {video.channel?.title && (
            <Link
              to={video.channel?.id ? `/channels/${video.channel.id}` : "#"}
              onClick={(e) => !video.channel?.id && e.preventDefault()}
              className="mt-1 block truncate text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {video.channel.title}
            </Link>
          )}

          {meta && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
              {meta}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
