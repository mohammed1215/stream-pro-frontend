import { ImageOff } from "lucide-react"
import type { VideoResponse } from "../lib/search"
import { formatDurationInSeconds } from "../lib/helpers"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { ChannelAvatar } from "./ChannelAvatar"

dayjs.extend(relativeTime)

export const VideoCard = ({ video }: { video: VideoResponse }) => {
  const dayObj = dayjs(video.updatedAt)
  return (
    <div className="w-full max-w-sm cursor-pointer bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="relative">
        {video.thumbnailUrl ? (
          <img
            className="rounded-t-lg w-full h-48 object-cover"
            src={video.thumbnailUrl}
            alt={video.title}
          />
        ) : (
          <div className="rounded-t-lg w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">
              <ImageOff /> No Image Available
            </span>
          </div>
        )}
        <span className="absolute bottom-0 right-0 bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded-tl-lg">
          {formatDurationInSeconds(video.durationSeconds)}
        </span>
      </div>
      <div className="p-5 flex items-center gap-3 mb-4">
        {/* Channel */}
        <ChannelAvatar
          channelProfileImageUrl={video.channelProfileImageUrl}
          channelName={video.channelName}
          channelId={video.channelId}
          size={15}
        />
        <div className="">
          <h5 className="mb-2 text-md font-bold tracking-tight line-clamp-2 text-gray-900 dark:text-white">
            {video.title}
          </h5>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {video.channelName}
          </p>
          <div className="flex gap-1 text-gray-500 dark:text-gray-400">
            <span className="text-sm ">{video.views} views</span>•
            <span className="text-sm">{dayObj.fromNow()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
