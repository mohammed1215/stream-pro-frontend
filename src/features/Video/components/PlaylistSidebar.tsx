import { motion } from "framer-motion"
import { Globe, Lock } from "lucide-react"
import type { LikedVideosResponse } from "../../../lib/likes"
import type { PlaylistDetailsDto } from "../../../lib/playlists"
import type { WatchLaterResponse } from "../../../lib/watchlater"
import { formatDurationInSeconds } from "../../../lib/helpers"

export const PlaylistSidebar = ({
  playlistId,
  playlistDetails,
  watchLaterDetails,
  likedVideosDetails,
  currentIndex,
  currentVideoId,
  onNavigate,
}: {
  playlistId: string | null
  playlistDetails?: PlaylistDetailsDto
  watchLaterDetails?: WatchLaterResponse
  likedVideosDetails?: LikedVideosResponse
  currentIndex: number
  currentVideoId?: string
  onNavigate: (videoId: string) => void
}) => (
  <>
    {/* Playlist Videos Section */}
    {playlistId && playlistId !== "WLP" && playlistId !== "LVP" && (
      <motion.div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="relative p-4 bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground line-clamp-2 mb-2">
                {playlistDetails?.title || "Playlist Name"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {playlistDetails?.isPublic ? (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Private</span>
                    </>
                  )}
                </div>
                <span className="text-border">•</span>
                <span>
                  {currentIndex} / {playlistDetails?.items?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-100 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {playlistDetails?.items?.map((video, index: number) => {
            const isCurrentVideo = video.videoId === currentVideoId
            return (
              <motion.div
                key={video.videoId}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className={`group relative flex gap-3 p-3 cursor-pointer transition-colors duration-150 ${
                  isCurrentVideo
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "hover:bg-accent/50 border-l-4 border-l-transparent"
                }`}
                onClick={() => onNavigate(video.videoId)}
              >
                <div className="flex items-center justify-center w-6 shrink-0 text-xs font-medium text-muted-foreground select-none">
                  {isCurrentVideo ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No Thumbnail
                    </div>
                  )}

                  {video.durationSeconds && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {formatDurationInSeconds(video.durationSeconds)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h3
                    className={`font-medium text-sm line-clamp-2 leading-tight transition-colors ${
                      isCurrentVideo
                        ? "text-primary font-semibold"
                        : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {video.title}
                  </h3>
                  {video.channelTitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {video.channelTitle}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )}

    {playlistId && playlistId === "WLP" && (
      <motion.div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="relative p-4 bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground line-clamp-2 mb-2">
                WatchLater
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {currentIndex} / {watchLaterDetails?.items?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-100 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {watchLaterDetails?.items?.map(({ video }, index: number) => {
            const isCurrentVideo = video.id === currentVideoId
            return (
              <motion.div
                key={video.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className={`group relative flex gap-3 p-3 cursor-pointer transition-colors duration-150 ${
                  isCurrentVideo
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "hover:bg-accent/50 border-l-4 border-l-transparent"
                }`}
                onClick={() => onNavigate(video.id)}
              >
                <div className="flex items-center justify-center w-6 shrink-0 text-xs font-medium text-muted-foreground select-none">
                  {isCurrentVideo ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No Thumbnail
                    </div>
                  )}

                  {video.durationSeconds && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {formatDurationInSeconds(video.durationSeconds)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h3
                    className={`font-medium text-sm line-clamp-2 leading-tight transition-colors ${
                      isCurrentVideo
                        ? "text-primary font-semibold"
                        : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {video.title}
                  </h3>
                  {video.channel.title && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {video.channel.title}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )}
    {playlistId && playlistId === "LVP" && (
      <motion.div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="relative p-4 bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground line-clamp-2 mb-2">
                Liked Videos
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {currentIndex} / {likedVideosDetails?.items?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-100 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {likedVideosDetails?.items?.map(({ video }, index: number) => {
            const isCurrentVideo = video.id === currentVideoId
            return (
              <motion.div
                key={video.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className={`group relative flex gap-3 p-3 cursor-pointer transition-colors duration-150 ${
                  isCurrentVideo
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "hover:bg-accent/50 border-l-4 border-l-transparent"
                }`}
                onClick={() => onNavigate(video.id)}
              >
                <div className="flex items-center justify-center w-6 shrink-0 text-xs font-medium text-muted-foreground select-none">
                  {isCurrentVideo ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No Thumbnail
                    </div>
                  )}

                  {video.durationSeconds && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {formatDurationInSeconds(video.durationSeconds)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h3
                    className={`font-medium text-sm line-clamp-2 leading-tight transition-colors ${
                      isCurrentVideo
                        ? "text-primary font-semibold"
                        : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {video.title}
                  </h3>
                  {video.channel.title && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {video.channel.title}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )}
  </>
)
