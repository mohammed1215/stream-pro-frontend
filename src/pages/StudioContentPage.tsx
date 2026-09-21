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
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
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
}

const MOCK_PLAYLISTS: StudioPlaylist[] = [
  {
    id: "p1",
    title: "Product Updates",
    videoCount: 12,
    isPublic: true,
    thumbnailUrl: "https://picsum.photos/seed/p1/400/225",
  },
  {
    id: "p2",
    title: "Draft Ideas",
    videoCount: 3,
    isPublic: false,
    thumbnailUrl: "https://picsum.photos/seed/p2/400/225",
  },
]

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
      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md /80 dark:bg-slate-900/60 dark:hover:border-slate-700"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-slate-700 transition group-hover:bg-primary/90/10 group-hover:text-primary  dark:text-slate-300 dark:group-hover:bg-primary/90/10 dark:group-hover:text-cyan-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-primary-foreground">
          {typeof number === "number" ? number.toLocaleString() : number}
        </h3>
        {spanWord && (
          <span className="text-xs font-medium text-slate-400">{spanWord}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 /80">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {description}
        </p>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              trend.isPositive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
            }`}
          >
            <ArrowUpRight
              className={`h-3 w-3 ${!trend.isPositive ? "rotate-90" : ""}`}
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
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      isPublished
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30"
        : "bg-secondary text-slate-600 ring-1 ring-slate-400/20  dark:text-slate-400 dark:ring-slate-700"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        isPublished ? "bg-emerald-500" : "bg-slate-400"
      }`}
    />
    {isPublished ? "Public" : "Draft"}
  </span>
)

// ---------- Toolbar ----------
type StatusFilter = "ALL" | "PUBLISHED" | "UNPUBLISHED"
type SortOption = "NEWEST" | "OLDEST" | "MOST_VIEWED"

const ContentToolbar = ({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  totalCount,
}: {
  query: string
  onQueryChange: (v: string) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  sort: SortOption
  onSortChange: (v: SortOption) => void
  totalCount: number
}) => (
  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-white p-3 shadow-sm /80 dark:bg-slate-900/50 dark:backdrop-blur-sm">
    {/* Search Input */}
    <div className="relative min-w-[220px] flex-1">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Filter your videos by title..."
        className="w-full rounded-xl border border-border bg-slate-50/60 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-ring focus:bg-white focus:ring-2 focus:ring-ring/20  dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-950"
      />
    </div>

    {/* Status Filter */}
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className="rounded-xl border border-border bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20  dark:bg-slate-950/60 dark:text-slate-300"
      >
        <option value="ALL">All Visibility</option>
        <option value="PUBLISHED">Public</option>
        <option value="UNPUBLISHED">Draft / Private</option>
      </select>

      {/* Sort Filter */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="rounded-xl border border-border bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20  dark:bg-slate-950/60 dark:text-slate-300"
      >
        <option value="NEWEST">Date: Newest</option>
        <option value="OLDEST">Date: Oldest</option>
        <option value="MOST_VIEWED">Most Views</option>
      </select>
    </div>

    {/* Video Counter */}
    <div className="ml-auto hidden items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 sm:flex">
      <span className="inline-flex h-6 items-center justify-center rounded-lg bg-accent px-2 font-mono text-xs font-bold text-accent-foreground /10 ">
        {totalCount}
      </span>
      <span>videos</span>
    </div>
  </div>
)

// ---------- Skeleton Loader ----------
const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100 /60">
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-28 shrink-0 rounded-xl bg-slate-200 " />
        <div className="space-y-2">
          <div className="h-4 w-44 rounded-lg bg-slate-200 " />
          <div className="h-3 w-24 rounded-lg bg-secondary dark:bg-slate-850" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-16 rounded-full bg-slate-200 " />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-12 rounded bg-slate-200 " />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-10 rounded bg-slate-200 " />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="ml-auto h-7 w-7 rounded-lg bg-slate-200 " />
    </td>
  </tr>
)

// ---------- Video Row with Quick Actions ----------
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
      className="group border-b border-slate-100 transition-colors hover:bg-slate-50/80 /60 dark:hover:bg-slate-900/40"
    >
      {/* Video Thumbnail & Info */}
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-4">
          <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary shadow-sm transition group-hover:border-cyan-500/40  dark:bg-slate-950">
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
              className="truncate text-left text-sm font-semibold text-slate-900 transition hover:text-primary dark:text-primary-foreground dark:hover:text-cyan-400 block max-w-md"
            >
              {video.title || "Untitled video"}
            </button>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
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
      <td className="px-6 py-3.5 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {fmtViews(video.views)}
      </td>

      {/* Duration */}
      <td className="px-6 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {formatDurationInSeconds(video.durationSeconds)}
      </td>

      {/* Quick Row Actions */}
      <td className="px-6 py-3.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            title="Edit details"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 shadow-sm transition hover:border-cyan-500 hover:text-primary  dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          {video.isPublished && (
            <a
              href={`/videos/${video.videoId}`}
              target="_blank"
              rel="noreferrer"
              title="Watch video"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 shadow-sm transition hover:border-cyan-500 hover:text-primary  dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            onClick={onDelete}
            title="Delete video"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-slate-600 shadow-sm transition hover:border-rose-500 hover:bg-rose-50 hover:text-rose-600  dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

// ---------- Videos Table Component ----------
interface VideosTableProps {
  query: string
  status: StatusFilter
  sort: SortOption
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export const VideosTable = ({
  query,
  status,
  sort,
  onEdit,
  onDelete,
}: VideosTableProps) => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FetchOwnerVideosChannelResponse, Error>({
    queryKey: ["videos", "owner", { query, status, sort }],
    queryFn: ({ pageParam }) => {
      if (typeof pageParam === "number")
        return fetchOwnerVideosChannel({
          page: pageParam,
          limit: 10,
          query,
          status,
          sortBy: sort,
        })
      return []
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined,
    initialPageParam: 1,
  })

  const videos = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )
  const totalCount = data?.pages[0]?.totalCount ?? 0

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm /80 dark:bg-slate-900/50">
        <table className="w-full border-collapse">
          <tbody>
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-12 text-center text-sm font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
        Couldn't load channel videos. Please refresh or try again later.
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-white/50 py-20 text-center  dark:bg-slate-900/30"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary /10 ">
          <Film className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-primary-foreground">
          {totalCount === 0
            ? "No videos uploaded yet"
            : "No videos match your query"}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          {totalCount === 0
            ? "Upload your first video to start building your channel audience."
            : "Try adjusting your search terms or filters to find what you need."}
        </p>
      </motion.div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm /80 dark:bg-slate-900/50 dark:backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-slate-50/75 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 /80 dark:bg-slate-950/40 dark:text-slate-400">
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

      {hasNextPage && (
        <div className="flex justify-center border-t border-slate-100 p-4 /60">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50  dark:bg-slate-900 dark:text-slate-300 "
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" />
                <span>Loading more...</span>
              </>
            ) : (
              "Load more videos"
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- Playlists Grid Component ----------
const PlaylistsGrid = () => {
  const { open } = usePlaylistModal()
  const { data: playlists, isPending } = useQuery({
    queryKey: ["playlists"],
    queryFn: () => getPlaylistsOwner(),
  })

  if (isPending) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">
        Loading playlists...
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
        className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/40 p-6 text-slate-500 transition hover:border-cyan-500 hover:bg-accent/20 hover:text-primary  dark:bg-slate-900/20 dark:text-slate-400 dark:hover:border-cyan-500/60 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white text-slate-700 shadow-sm transition group-hover:scale-110 group-hover:text-primary  dark:bg-slate-900 dark:text-slate-300 dark:group-hover:text-cyan-400">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-center">
          <span className="text-sm font-bold text-slate-900 dark:text-primary-foreground">
            Create Playlist
          </span>
          <p className="mt-0.5 text-xs text-slate-400">
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
            className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md  dark:bg-slate-900/60 dark:hover:border-slate-700"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-slate-950 flex items-center justify-center p-3">
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
                      className="absolute h-[80%] w-[85%] rounded-xl border border-slate-800/60 object-cover shadow-lg transition-transform duration-300"
                      style={{
                        zIndex: 3 - index,
                        transform: `translate(${offset}px, ${-offset}px)`,
                        opacity: 1 - depth * 0.1,
                      }}
                    />
                  )
                })
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-600">
                  <ListVideo className="h-8 w-8" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Playlist Stats / Badge */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-primary-foreground">
                <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 font-mono text-[10px] font-bold backdrop-blur-md">
                  <ListVideo className="h-3 w-3 text-cyan-400" />
                  {pl.videoCount} videos
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    pl.isPublic
                      ? "bg-emerald-500/80 text-primary-foreground"
                      : "bg-slate-700/80 text-slate-200"
                  }`}
                >
                  {pl.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>

            {/* Title & Info */}
            <div className="p-4">
              <h4 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-primary-foreground dark:group-hover:text-cyan-400">
                {pl.title}
              </h4>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
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

  const navigate = useNavigate()
  const { deleteVideo } = useVideo()

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

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary ">
              <span>Studio</span>
              <span>/</span>
              <span>Content</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-primary-foreground sm:text-3xl">
              Channel Content
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
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
        <div className="flex gap-1 rounded-xl border border-border/80 bg-secondary/80 p-1 w-fit  dark:bg-slate-900">
          {(
            [
              { id: "videos", label: "Videos", Icon: VideoIcon },
              { id: "playlists", label: "Playlists", Icon: Film },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === id
                  ? "text-slate-900 dark:text-primary-foreground"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="active-content-tab"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 rounded-lg bg-white shadow-sm "
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
              />

              <VideosTable
                query={debouncedQuery}
                status={status}
                sort={sort}
                onEdit={(id) => navigate(`/studio/content/${id}/edit`)}
                onDelete={(id) => deleteVideo(id)}
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
              <PlaylistsGrid playlists={MOCK_PLAYLISTS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
