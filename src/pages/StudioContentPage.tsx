import {
  Eye,
  Video as VideoIcon,
  Search,
  Loader2,
  Plus,
  Film,
  Clock,
  TrendingUp,
  ListVideo,
  ArrowUpRight,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  fetchOwnerVideosChannel,
  type FetchOwnerVideosChannelResponse,
} from "../lib/video"
import { usePlaylistModal } from "../hooks/usePlaylistModal"
import { useVideo } from "../hooks/useVideo"
import { formatDurationInSeconds } from "../lib/helpers"
import { getPlaylistsOwner } from "../lib/playlists"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

// ---------- Hooks ----------
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])
  return debounced
}

// ---------- Types ----------
interface StudioVideo {
  videoId: string
  title: string
  videoUrl: string
  thumbnailUrl: string
  channelId: string
  channelTitle: string
  channelImageUrl: string
  durationSeconds: number
  views: number
  isPublished: boolean
}

interface StudioPlaylist {
  id: string
  title: string
  videoCount: number
  isPublic: boolean
  thumbnailUrl: string
  videos?: { id: string; thumbnailUrl: string }[]
}

const fmtViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("en-US")
}

// ---------- Motion Variants ----------
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
}

// ---------- Summary Metric Card ----------
const StudioContentCard = ({
  title,
  number,
  spanWord,
  Icon,
  description,
  trend,
}: {
  title: string
  number: number | string
  spanWord?: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
  trend?: { value: string; isPositive: boolean }
}) => {
  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          {typeof number === "number" ? number.toLocaleString() : number}
        </h3>
        {spanWord && (
          <span className="text-xs font-medium text-muted-foreground">
            {spanWord}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              trend.isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <ArrowUpRight
              className={cn("h-3 w-3", !trend.isPositive && "rotate-90")}
            />
            {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ---------- Status Badge ----------
const StatusPill = ({ isPublished }: { isPublished: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
      isPublished
        ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-400"
        : "bg-muted text-muted-foreground ring-1 ring-border"
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        isPublished ? "bg-emerald-500" : "bg-muted-foreground"
      )}
    />
    {isPublished ? "Public" : "Draft"}
  </span>
)

// ---------- Pagination Controls ----------
const PaginationControls = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  disabled,
}: {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  disabled?: boolean
}) => {
  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-4">
      <div className="text-xs text-muted-foreground">
        Page <span className="font-bold text-foreground">{currentPage}</span> of{" "}
        <span className="font-bold text-foreground">{totalPages || 1}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-lg"
          disabled={!hasPrevPage || disabled}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-lg"
          disabled={!hasNextPage || disabled}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ---------- Toolbar ----------
type StatusFilter = "ALL" | "PUBLISHED" | "UNPUBLISHED"
type SortOption = "NEWEST" | "OLDEST" | "MOST_VIEWED"
type ViewMode = "table" | "grid"

const ContentToolbar = ({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  totalCount,
  viewMode,
  onViewModeChange,
}: {
  query: string
  onQueryChange: (v: string) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  sort: SortOption
  onSortChange: (v: SortOption) => void
  totalCount: number
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
}) => (
  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
    {/* Search Input */}
    <div className="relative min-w-[220px] flex-1">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Filter your videos by title..."
        className="w-full rounded-xl border border-input bg-muted/40 py-2 pl-9 pr-4 text-xs font-medium text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
      />
    </div>

    {/* Status Filter */}
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className="rounded-xl border border-input bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        <option value="ALL">All Visibility</option>
        <option value="PUBLISHED">Public</option>
        <option value="UNPUBLISHED">Draft / Private</option>
      </select>

      {/* Sort Filter */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="rounded-xl border border-input bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        <option value="NEWEST">Date: Newest</option>
        <option value="OLDEST">Date: Oldest</option>
        <option value="MOST_VIEWED">Most Views</option>
      </select>
    </div>

    {/* View Mode Toggle */}
    <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
      <button
        onClick={() => onViewModeChange("table")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          viewMode === "table"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Table view"
      >
        <TableIcon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          viewMode === "grid"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>

    {/* Video Counter */}
    <div className="ml-auto hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
      <span className="inline-flex h-6 items-center justify-center rounded-lg bg-secondary px-2 font-mono text-xs font-bold text-foreground">
        {totalCount}
      </span>
      <span>videos</span>
    </div>
  </div>
)

// ---------- Skeleton Loader ----------
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

// ---------- Video Row ----------
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

// ---------- Video Grid Card (for Grid View) ----------
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

// ---------- Videos Table / Grid Component ----------
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

// ---------- Playlists Grid Component ----------
const PlaylistsGrid = () => {
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

// ---------- Main Page Component ----------
type ContentTab = "videos" | "playlists"

export const StudioContentPage = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>("videos")
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, 350)
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [sort, setSort] = useState<SortOption>("NEWEST")
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const limit = 10

  const navigate = useNavigate()
  const { deleteVideo } = useVideo()

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, status, sort])

  const { data: statsData } = useQuery({
    queryKey: ["owner-channel-stats"],
    queryFn: () => fetchOwnerVideosChannel({ page: 1, limit: 10 }),
  })

  const stats = useMemo(() => {
    if (!statsData) return null
    return {
      totalVideos: statsData.totalCount,
      totalViews: statsData.items.reduce((sum, v) => sum + v.views, 0),
      published: statsData.items.filter((v) => v.isPublished).length,
      draft: statsData.items.filter((v) => !v.isPublished).length,
    }
  }, [statsData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // Scroll to top of the table
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <span>Studio</span>
              <span>/</span>
              <span>Content</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Channel Content
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage your video library, check upload statuses, and organize
              playlists.
            </p>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StudioContentCard
            title="Total Videos"
            number={stats?.totalVideos ?? 0}
            description={`${stats?.draft ?? 0} unpublished drafts`}
            Icon={VideoIcon}
            trend={{ value: "+8%", isPositive: true }}
          />
          <StudioContentCard
            title="Total Views"
            number={stats?.totalViews ?? 0}
            description="Accumulated lifetime views"
            Icon={Eye}
            trend={{ value: "+14.2%", isPositive: true }}
          />
          <StudioContentCard
            title="Published"
            number={stats?.published ?? 0}
            spanWord="videos"
            description="Live on channel"
            Icon={TrendingUp}
          />
          <StudioContentCard
            title="Drafts"
            number={stats?.draft ?? 0}
            spanWord="videos"
            description="Pending details / upload"
            Icon={Clock}
          />
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex gap-1 rounded-xl border border-border bg-secondary/80 p-1 w-fit">
          {(
            [
              { id: "videos", label: "Videos", Icon: VideoIcon },
              { id: "playlists", label: "Playlists", Icon: Film },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                activeTab === id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="active-content-tab"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 rounded-lg bg-card shadow-sm"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab View Transition */}
        <AnimatePresence mode="wait">
          {activeTab === "videos" ? (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <ContentToolbar
                query={query}
                onQueryChange={setQuery}
                status={status}
                onStatusChange={setStatus}
                sort={sort}
                onSortChange={setSort}
                totalCount={stats?.totalVideos ?? 0}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              <VideosView
                query={debouncedQuery}
                status={status}
                sort={sort}
                page={page}
                limit={limit}
                viewMode={viewMode}
                onEdit={(id) => navigate(`/studio/content/${id}/edit`)}
                onDelete={(id) => deleteVideo(id)}
                onPageChange={handlePageChange}
              />
            </motion.div>
          ) : (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <PlaylistsGrid />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
