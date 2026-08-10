import { ImageOff, Music2 } from "lucide-react"
import type { VideoResponse } from "../lib/search"
import { formatDuration } from "../lib/helpers"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

export const VideoSearchCard = ({
  video,
  hoverColoring,
}: {
  video: VideoResponse
  hoverColoring: string
}) => {
  const dayObj = dayjs(video.updatedAt)
  return (
    <div
      className={`
  w-full flex flex-col md:flex-row cursor-pointer bg-white
  ${hoverColoring}
  border border-gray-200 rounded-lg shadow
  dark:bg-gray-800 dark:border-gray-700
  hover:scale-101 transition-all
`}
    >
      <div className="relative w-full shrink-0 md:w-1/2 h-48 md:h-auto aspect-video">
        {video.thumbnailUrl ? (
          <img
            className="rounded-lg w-full h-full object-cover"
            src={video.thumbnailUrl}
            alt={video.title}
          />
        ) : (
          <div className="rounded-t-lg w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">
              <ImageOff /> No Image Available
            </span>
          </div>
        )}
        <span className="absolute bottom-2 flex gap-1 items-center right-2 bg-black/50 text-white text-xs font-medium px-1 py-0.5 rounded-[5px]">
          <Music2 className="w-3.5 h-3.5" /> {formatDuration(video.duration)}
        </span>
      </div>
      <div className="p-5 flex items-center gap-3 mb-4">
        {/* Channel */}
        <div className={"w-15 h-15 "}>
          {video.channelProfileImageUrl ? (
            <img
              className="rounded-full object-cover"
              src={video.channelProfileImageUrl}
              alt={video.channelName}
            />
          ) : (
            <div className=" bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500">
                {video.channelName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
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
