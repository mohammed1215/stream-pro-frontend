import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { VideoDetailResponse } from "../../../lib/video"
import { formatNumber } from "../../../lib/helpers"
import dayjs from "../../../lib/dayjs"
import { cn } from "../../../lib/utils"

export function DescriptionBox({
  description,
  canExpand,
  openDescription,
  setOpenDescription,
  videoData,
}: {
  description: string
  canExpand: boolean
  openDescription: boolean
  setOpenDescription: React.Dispatch<React.SetStateAction<boolean>>
  videoData: VideoDetailResponse & { tags?: { id: string; name: string }[] }
}) {
  const navigate = useNavigate()
  const tags = videoData.tags ?? []

  return (
    <motion.div
      layout
      className={cn(
        "mt-4 rounded-xl bg-muted/50 p-4 transition-colors",
        canExpand && "cursor-pointer hover:bg-muted/70"
      )}
      onClick={() => canExpand && setOpenDescription((prev) => !prev)}
    >
      {/* Views & Timestamp */}
      <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
        <span>{formatNumber(videoData.views)} views</span>
        <span aria-hidden>•</span>
        <time dateTime={dayjs(videoData.createdAt).toISOString()}>
          {dayjs(videoData.createdAt).fromNow()}
        </time>
      </div>

      {/* Description Text */}
      <motion.div
        layout
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p
          className={cn(
            "text-sm whitespace-pre-line text-foreground/90 leading-relaxed",
            !openDescription && canExpand && "line-clamp-2"
          )}
        >
          {description || "No description provided."}
        </p>
      </motion.div>

      {(openDescription || !canExpand) && tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(tag.name)}`)
              }
              className="inline-flex items-center rounded-lg bg-background/80 hover:bg-background border border-border/60 px-2.5 py-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors shadow-xs"
            >
              #{tag.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* Show More / Less Button */}
      {canExpand && (
        <button
          type="button"
          aria-expanded={openDescription}
          onClick={(e) => {
            e.stopPropagation()
            setOpenDescription((prev) => !prev)
          }}
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-foreground transition-colors hover:text-primary"
        >
          {openDescription ? "Show less" : "Show more"}
          {openDescription ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </motion.div>
  )
}
