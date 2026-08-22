import { Link } from "react-router-dom"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { formatDuration, formatNumber } from "../lib/helpers"

dayjs.extend(relativeTime)

type VideoCardVideo = {
  id?: string
  title?: string
  thumbnailUrl?: string
  duration?: number
  views?: number
  createdAt?: string
  channel: {
    id?: string
    title?: string
    thumbnailUrl?: string
  }
}

type VideoCardProps = {
  video: VideoCardVideo
}

export const HomeVideoCard = ({ video }: VideoCardProps) => {
  const views = typeof video.views === "number" ? video.views : null

  const meta = [
    views !== null
      ? `${formatNumber(views)} ${views === 1 ? "view" : "views"}`
      : null,
    video.createdAt ? dayjs(video.createdAt).fromNow() : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" • ")

  return (
    <Link
      to={video.id ? `/videos/${video.id}` : "#"}
      onClick={(event) => {
        if (!video.id) event.preventDefault()
      }}
      className={`
        group flex h-full flex-col overflow-hidden rounded-2xl bg-white
        ring-1 ring-zinc-200 shadow-sm transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl hover:ring-zinc-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-zinc-700
      `}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title ?? "Video thumbnail"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm font-medium text-zinc-400 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-500">
            No preview
          </div>
        )}

        {/* Hover gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Play icon overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-100">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="h-5 w-5 translate-x-0.5"
            >
              <path d="M8 5.14v13.72L19 12 8 5.14z" />
            </svg>
          </div>
        </div>

        {video.duration ? (
          <span className="absolute bottom-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur-sm">
            {formatDuration(video.duration)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 gap-3 p-4">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 transition duration-300 group-hover:ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700">
          {video.channel?.thumbnailUrl ? (
            <img
              src={video.channel.thumbnailUrl}
              alt={video.channel.title ?? "Channel avatar"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-zinc-600 dark:text-zinc-300">
              {video.channel?.title?.[0] ?? "V"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 transition-colors duration-200 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
            {video.title ?? "Untitled video"}
          </h3>

          {video.channel?.title ? (
            <p className="mt-1.5 truncate text-xs font-medium text-zinc-500 transition-colors duration-200 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200">
              {video.channel.title}
            </p>
          ) : null}

          {meta ? (
            <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
              {meta}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
