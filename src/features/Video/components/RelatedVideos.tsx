import { motion } from "framer-motion"
import { ListVideo } from "lucide-react"
import { formatDurationInSeconds, formatNumber } from "../../../lib/helpers"
import type { RelatedVideo } from "./videoTypes"

export const RelatedVideos = ({
  relatedVideos,
  isLoadingRelated,
  onSelect,
}: {
  relatedVideos?: RelatedVideo[]
  isLoadingRelated: boolean
  onSelect: (videoId: string) => void
}) => (
  <motion.div className="bg-card border border-border rounded-xl p-4 shadow-sm">
    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
      <ListVideo className="w-5 h-5 text-primary" />
      Up Next
    </h2>

    <div className="space-y-3">
      {isLoadingRelated ? (
        /* Skeleton Loading State */
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-1">
            <div className="w-36 aspect-video bg-muted rounded-lg shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-2.5 w-1/2 bg-muted/60 rounded animate-pulse mt-2" />
            </div>
          </div>
        ))
      ) : relatedVideos && relatedVideos.length > 0 ? (
        relatedVideos.map((video) => (
          <motion.div
            key={video.videoId}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelect(video.videoId)}
            className="group flex gap-3 p-1.5 rounded-lg hover:bg-accent/60 cursor-pointer transition-colors duration-150"
          >
            {/* Thumbnail + Duration */}
            <div className="relative w-36 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  No Thumbnail
                </div>
              )}

              {typeof video.durationSeconds === "number" && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                  {formatDurationInSeconds(video.durationSeconds)}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="flex-1 min-w-0 flex flex-col justify-start">
              <h3
                className="font-medium text-sm line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors"
                title={video.title}
              >
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                {video.channelTitle}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <span>{formatNumber(video.views)} views</span>
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No related videos found
        </div>
      )}
    </div>
  </motion.div>
)
