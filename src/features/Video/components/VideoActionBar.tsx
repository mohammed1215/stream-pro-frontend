import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  MoreHorizontal,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import { ChannelAvatar } from "../../../components/ChannelAvatar"
import { Button } from "../../../components/ui/button"
import type { VideoDetailResponse } from "../../../lib/video"
import { formatNumber } from "../../../lib/helpers"
import { cn } from "../../../lib/utils"
import { MoreOptionsDropdown } from "./MoreOptionsDropdown"

export const VideoActionBar = ({
  videoData,
  videoId,
  openMoreVideoSettings,
  onToggleMore,
  onCloseMore,
  onSubscribe,
  onUnsubscribe,
  onLike,
  onUnlike,
}: {
  videoData: VideoDetailResponse
  videoId?: string
  openMoreVideoSettings: boolean
  onToggleMore: () => void
  onCloseMore: () => void
  onSubscribe: (channelId: string) => void
  onUnsubscribe: (channelId: string) => void
  onLike: () => void
  onUnlike: () => void
}) => (
  <motion.div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
    <div className="flex items-center gap-3">
      <ChannelAvatar
        channelProfileImageUrl={videoData.channelImageUrl}
        channelName={videoData.channelTitle}
        channelId={videoData.channelId}
        size={12}
      />
      <div className="flex flex-col">
        <Link
          to={`/channels/${videoData.channelId}`}
          className="font-bold hover:opacity-80 transition"
        >
          {videoData.channelTitle}
        </Link>
        <span className="text-xs text-muted-foreground">
          {formatNumber(videoData.channelSubscribersCount)} subscribers
        </span>
      </div>

      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Button
          variant={videoData.isSubscribed ? "secondary" : "default"}
          size="lg"
          className={cn(
            "rounded-full font-bold px-6 ml-2 transition-all",
            videoData.isSubscribed
              ? "bg-muted hover:bg-muted/80"
              : "bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black"
          )}
          onClick={() =>
            videoData.isSubscribed
              ? onUnsubscribe(videoData.channelId)
              : onSubscribe(videoData.channelId)
          }
        >
          {videoData.isSubscribed ? "Subscribed" : "Subscribe"}
        </Button>
      </motion.div>
    </div>

    <div className="flex items-center gap-2 flex-wrap">
      {/* Like Pill */}
      <div className="flex items-center bg-muted rounded-full overflow-hidden border border-border">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            className="rounded-none rounded-l-full gap-2 px-4 hover:bg-accent"
            onClick={() =>
              videoData.isLiked ? onUnlike() : onLike()
            }
          >
            <ThumbsUp
              className={cn(
                "h-5 w-5 transition-transform",
                videoData.isLiked && "fill-primary text-primary scale-110"
              )}
            />
            <span className="font-bold">
              {formatNumber(videoData.likesCount)}
            </span>
          </Button>
        </motion.div>
        <div className="w-px h-6 bg-border" />
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            className="rounded-none rounded-r-full px-3 hover:bg-accent"
          >
            <ThumbsDown className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Button variant="secondary" className="rounded-full gap-2 px-4 font-bold">
          <Share2 className="h-5 w-5" /> Share
        </Button>
      </motion.div>

      {/* MORE OPTIONS DROPDOWN */}
      <div className="relative">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onToggleMore}
            aria-expanded={openMoreVideoSettings}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </motion.div>
        <MoreOptionsDropdown
          isOpen={openMoreVideoSettings}
          videoId={videoId}
          onClose={onCloseMore}
        />
      </div>
    </div>
  </motion.div>
)
