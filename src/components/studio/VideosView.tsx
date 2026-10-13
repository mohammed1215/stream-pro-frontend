import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Edit3, ExternalLink, Eye, Film, Trash2 } from "lucide-react"
import {
  fetchOwnerVideosChannel,
  type FetchOwnerVideosChannelResponse,
} from "../../lib/video"
import { formatDurationInSeconds } from "../../lib/helpers"
import { cn } from "../../lib/utils"
import { StatusPill } from "./StatusPill"
import { PaginationControls } from "./PaginationControls"
import { fmtViews, type StudioVideo } from "./studioVideo"
import type { SortOption, StatusFilter, ViewMode } from "./contentFilters"

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-border">
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-28 shrink-0 rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-44 rounded-lg bg-muted" />
          <div className="h-3 w-24 rounded-lg bg-muted" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-16 rounded-full bg-muted" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-12 rounded bg-muted" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-10 rounded bg-muted" />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="ml-auto h-7 w-7 rounded-lg bg-muted" />
    </td>
  </tr>
)

const VideoRow = ({
  video,
  index,
  onEdit,
  onDelete,
}: {
  video: StudioVideo
  index: number
  onEdit: () => void
  onDelete: () => void
}) => {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, delay: Math.min(index, 6) * 0.02 }}
      className="group border-b border-border transition-colors hover:bg-muted/40"
    >
      {/* Video Thumbnail & Info */}
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-4">
          <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted shadow-sm transition group-hover:border-primary/40">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground backdrop-blur-sm">
              {formatDurationInSeconds(video.durationSeconds)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <button
              onClick={onEdit}
              className="truncate text-left text-sm font-semibold text-foreground transition hover:text-primary block max-w-md"
            >
              {video.title || "Untitled video"}
            </button>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{video.channelTitle}</span>
              <span>•</span>
              <span className="font-mono text-[11px]">{video.videoId}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Visibility */}
      <td className="px-6 py-3.5 whitespace-nowrap">
        <StatusPill isPublished={video.isPublished} />
      </td>

      {/* Views */}
      <td className="px-6 py-3.5 text-xs font-semibold tabular-nums text-foreground/80 whitespace-nowrap">
        {fmtViews(video.views)}
      </td>

      {/* Duration */}
      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatDurationInSeconds(video.durationSeconds)}
      </td>

      {/* Quick Row Actions */}
      <td className="px-6 py-3.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            title="Edit details"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:border-primary hover:text-primary"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          {video.isPublished && (
            <a
              href={`/videos/${video.videoId}`}
              target="_blank"
              rel="noreferrer"
              title="Watch video"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:border-primary hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            onClick={onDelete}
            title="Delete video"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

const VideoGridCard = ({
  video,
  onEdit,
  onDelete,
}: {
  video: StudioVideo
  onEdit: () => void
  onDelete: () => void
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    whileHover={{ y: -3 }}
    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md"
  >
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground backdrop-blur-sm">
        {formatDurationInSeconds(video.durationSeconds)}
      </span>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-primary hover:text-primary-foreground"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-destructive hover:text-primary-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onEdit}
          className="truncate text-sm font-semibold text-foreground hover:text-primary text-left"
        >
          {video.title || "Untitled video"}
        </button>
        <StatusPill isPublished={video.isPublished} />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" /> {fmtViews(video.views)}
        </span>
        <span>•</span>
        <span>{video.channelTitle}</span>
      </div>
    </div>
  </motion.div>
)

interface VideosViewProps {
  query: string
  status: StatusFilter
  sort: SortOption
  page: number
  limit: number
  viewMode: ViewMode
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onPageChange: (page: number) => void
}

export const VideosView = ({
  query,
  status,
  sort,
  page,
  limit,
  viewMode,
  onEdit,
  onDelete,
  onPageChange,
}: VideosViewProps) => {
  const { data, isLoading, isError, isFetching } =
    useQuery<FetchOwnerVideosChannelResponse>({
      queryKey: ["videos", "owner", { query, status, sort, page, limit }],
      queryFn: () =>
        fetchOwnerVideosChannel({
          page,
          limit,
          query,
          status,
          sortBy: sort,
        }),
      placeholderData: (prev) => prev, // Keep previous data while fetching
    })

  const videos = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1
  const hasNextPage = data?.hasNextPage ?? false
  const hasPrevPage = page > 1

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse">
          <tbody>
            {[...Array(limit)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center text-sm font-medium text-destructive">
        Couldn't load channel videos. Please refresh or try again later.
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 py-20 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <Film className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-foreground">
          {totalCount === 0
            ? "No videos uploaded yet"
            : "No videos match your query"}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {totalCount === 0
            ? "Upload your first video to start building your channel audience."
            : "Try adjusting your search terms or filters to find what you need."}
        </p>
      </motion.div>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-opacity",
        isFetching && !isLoading && "opacity-60"
      )}
    >
      {viewMode === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3.5">Video</th>
                <th className="px-6 py-3.5">Visibility</th>
                <th className="px-6 py-3.5">Views</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {videos.map((video, index) => (
                  <VideoRow
                    key={video.videoId}
                    video={video}
                    index={index}
                    onEdit={() => onEdit(video.videoId)}
                    onDelete={() => onDelete(video.videoId)}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {videos.map((video) => (
                <VideoGridCard
                  key={video.videoId}
                  video={video}
                  onEdit={() => onEdit(video.videoId)}
                  onDelete={() => onDelete(video.videoId)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={onPageChange}
          disabled={isFetching}
        />
      )}
    </div>
  )
}
