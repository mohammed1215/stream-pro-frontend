import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Clock, ListVideo, Loader2, Plus } from "lucide-react"
import { usePlaylistModal } from "../../hooks/usePlaylistModal"
import { getPlaylistsOwner } from "../../lib/playlists"
import { cn } from "../../lib/utils"
import { fadeUpItem, staggerContainer } from "./studioMotion"

export const PlaylistsGrid = () => {
  const { open } = usePlaylistModal()
  const { data: playlists, isPending } = useQuery({
    queryKey: ["owner-playlists"],
    queryFn: () => getPlaylistsOwner(),
  })

  if (isPending) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {/* Create Playlist Action Card */}
      <motion.button
        variants={fadeUpItem}
        onClick={() => open()}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/40 p-6 text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition group-hover:scale-110 group-hover:border-primary group-hover:text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-center">
          <span className="text-sm font-bold text-foreground">
            Create Playlist
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Group your videos together
          </p>
        </div>
      </motion.button>

      {/* Playlist Cards */}
      {playlists?.map((pl) => {
        const videos = pl.videos ?? []

        return (
          <motion.div
            key={pl.id}
            variants={fadeUpItem}
            whileHover={{ y: -3 }}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-muted flex items-center justify-center p-3">
              {videos.length > 0 ? (
                videos.slice(0, 3).map((video, index) => {
                  const depth = index
                  const offset = depth * 10

                  return (
                    <img
                      key={video.id}
                      src={video.thumbnailUrl}
                      alt={index === 0 ? pl.title : ""}
                      aria-hidden={index !== 0}
                      className="absolute h-[80%] w-[85%] rounded-xl border border-border/60 object-cover shadow-lg transition-transform duration-300"
                      style={{
                        zIndex: 3 - index,
                        transform: `translate(${offset}px, ${-offset}px)`,
                        opacity: 1 - depth * 0.1,
                      }}
                    />
                  )
                })
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ListVideo className="h-8 w-8" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Playlist Stats / Badge */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-primary-foreground">
                <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 font-mono text-[10px] font-bold backdrop-blur-md">
                  <ListVideo className="h-3 w-3 text-primary" />
                  {pl.videoCount} videos
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    pl.isPublic
                      ? "bg-emerald-500/80 text-primary-foreground"
                      : "bg-muted/80 text-foreground"
                  )}
                >
                  {pl.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>

            {/* Title & Info */}
            <div className="p-4">
              <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                {pl.title}
              </h4>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Updated recently</span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
