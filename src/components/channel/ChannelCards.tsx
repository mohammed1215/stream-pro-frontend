import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
import {
  Clock,
  Film,
  Globe,
  Heart,
  Layers,
  ListVideo,
  Lock,
  Play,
  type LucideIcon,
} from "lucide-react"
import { formatDurationInSeconds, formatNumber } from "../../lib/helpers"
import dayjs from "../../lib/dayjs"
import { VideoActionMenu } from "../VideoActionMenu"
import { cardItemVariants } from "./channelVariants"
import type { PlaylistType, VideoType } from "./channelTypes"

export const ChannelVideoItem = ({
  video,
  isOwner = false,
}: {
  video: VideoType
  isOwner?: boolean
}) => {
  const navigate = useNavigate()

  return (
    <motion.div
      className="channel-card video-card group"
      variants={cardItemVariants}
      layout
      whileHover={{ y: -4 }}
      whileTap={{ y: -1, scale: 0.99 }}
      onClick={() => navigate(`/videos/${video.videoId}`)}
    >
      <div className="card-thumbnail-wrapper">
        <img
          className="card-thumbnail-img"
          src={video.thumbnailUrl}
          alt={video.videoTitle}
          loading="lazy"
        />

        <div className="card-top-actions" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {video.isLikedByUser && (
              <motion.span
                className="card-badge liked-badge"
                title="Liked by you"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Heart size={13} fill="currentColor" />
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button
            className={`quick-action-btn ${
              video.isInWatchLater ? "active" : ""
            }`}
            title={
              video.isInWatchLater ? "In Watch Later" : "Save to Watch Later"
            }
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <Clock size={14} />
          </motion.button>
        </div>

        {video.durationSeconds != null && (
          <span className="absolute bottom-1.5 right-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold leading-none text-white tabular-nums">
            {formatDurationInSeconds(video.durationSeconds)}
          </span>
        )}

        <div className="card-overlay">
          <motion.div
            className="play-icon-badge"
            initial={{ scale: 0.7 }}
            whileHover={{ scale: 1 }}
          >
            <Play size={20} fill="currentColor" />
          </motion.div>
        </div>
      </div>

      <div className="card-content">
        <div className="card-title-row">
          <h3 className="card-title" title={video.videoTitle}>
            {video.videoTitle}
          </h3>

          <div
            className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoActionMenu
              video={{
                id: video.videoId,
                title: video.videoTitle,
                thumbnailUrl: video.thumbnailUrl,
              }}
              isOwner={isOwner}
              onEdit={() => navigate(`/studio/content/${video.videoId}/edit`)}
              onDelete={() => {
                // Delete mutation call
              }}
            />
          </div>
        </div>

        <div className="card-meta">
          <span>{formatNumber(video.views)} views</span>
          <span className="dot-divider">•</span>
          <span>{dayjs(video.createdAt).fromNow()}</span>
        </div>
      </div>
    </motion.div>
  )
}

export const ChannelPlaylistItem = ({
  playlist,
  isOwner = false,
}: {
  playlist: PlaylistType
  isOwner?: boolean
}) => {
  const navigate = useNavigate()
  const isEmpty = playlist.videosCount === 0

  const validThumbnails = (playlist.thumbnails ?? []).filter((t): t is string =>
    Boolean(t)
  )
  const hasThumbnails = validThumbnails.length > 0
  const count = Math.min(validThumbnails.length, 4)

  const handleClick = () => {
    if (isEmpty) return
    navigate(`/playlist?list=${playlist.id}`)
  }

  return (
    <motion.div
      className={`channel-card playlist-card ${isEmpty ? "is-empty" : ""}`}
      variants={cardItemVariants}
      layout
      whileHover={isEmpty ? undefined : { y: -4 }}
      whileTap={isEmpty ? undefined : { y: -1, scale: 0.99 }}
      onClick={handleClick}
      role={isEmpty ? "presentation" : "button"}
      tabIndex={isEmpty ? -1 : 0}
    >
      <div className="card-thumbnail-wrapper relative w-full h-full overflow-hidden">
        {hasThumbnails ? (
          <div
            className={`grid w-full h-full gap-0.5 ${
              count === 1
                ? "grid-cols-1"
                : count === 2
                ? "grid-cols-2"
                : "grid-cols-2 grid-rows-2"
            }`}
          >
            {validThumbnails.slice(0, 4).map((thumb, index) => (
              <img
                key={index}
                src={thumb}
                alt={`${playlist.title} thumbnail ${index + 1}`}
                loading="lazy"
                className={`w-full h-full object-cover ${
                  count === 3 && index === 0 ? "row-span-2" : ""
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="playlist-thumbnail-fallback flex items-center justify-center w-full h-full">
            <ListVideo size={36} className="text-accent" />
          </div>
        )}

        {isOwner && (
          <div className="playlist-visibility-badge absolute top-2 right-2 z-10">
            {playlist.isPublic ? (
              <span
                title="Public Playlist"
                className="flex items-center gap-1 text-xs bg-black/60 text-white px-2 py-1 rounded-full"
              >
                <Globe size={13} /> Public
              </span>
            ) : (
              <span
                title="Private Playlist"
                className="flex items-center gap-1 text-xs bg-black/60 text-white px-2 py-1 rounded-full"
              >
                <Lock size={13} /> Private
              </span>
            )}
          </div>
        )}

        <div
          className={`playlist-count-badge absolute bottom-2 right-2 z-10 flex items-center gap-1 text-xs bg-black/60 text-white px-2 py-1 rounded-full ${
            isEmpty ? "empty-badge" : ""
          }`}
        >
          <Layers size={14} />
          <span>
            {isEmpty
              ? "0 videos (Empty)"
              : `${playlist.videosCount} ${
                  playlist.videosCount === 1 ? "video" : "videos"
                }`}
          </span>
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title" title={playlist.title}>
          {playlist.title}
        </h3>
        {playlist.description && (
          <p className="card-description">{playlist.description}</p>
        )}
        <div className="card-meta">
          <span>Updated {dayjs(playlist.updatedAt).fromNow()}</span>
        </div>
      </div>
    </motion.div>
  )
}

export const EmptyState = ({
  message,
  icon: Icon = Film,
}: {
  message: string
  icon?: LucideIcon
}) => (
  <motion.div
    className="channel-empty-state"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Icon size={48} className="empty-icon" />
    <p>{message}</p>
  </motion.div>
)
