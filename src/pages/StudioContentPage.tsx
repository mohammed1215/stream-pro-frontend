import {
  Eye,
  VideoIcon,
  Search,
  MoreVertical,
  Loader2,
  Plus,
  Film,
  Clock,
  TrendingUp,
  Play,
  ListVideo,
  ArrowUpRight,
} from "lucide-react"
import "./StudioContentPage.css"
import { useMemo, useState } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import {
  fetchOwnerVideosChannel,
  type FetchOwnerVideosChannelResponse,
} from "../lib/video"
import { useNavigate } from "react-router-dom"

// ---------- Types ----------
interface StudioVideo {
  videoId: string
  title: string
  videoUrl: string
  thumbnailUrl: string
  channelId: string
  channelTitle: string
  channelImageUrl: string
  duration: number
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

// ---------- Mock Playlists ----------
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

// ---------- Formatters ----------
const fmtViews = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString("en-US")
}

const fmtDuration = (s: number) => {
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${String(ss).padStart(2, "0")}`
}

// ---------- Summary card ----------
const StudioContentCard = ({
  title,
  number,
  spanWord,
  Icon,
  description,
  accent,
  trend, // Added mock trend prop
}: {
  title: string
  number: number | string
  spanWord?: string
  description: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  accent: "blue" | "emerald" | "purple" | "amber"
  trend?: { value: string; isPositive: boolean }
}) => {
  const accents = {
    blue: {
      bg: "from-blue-50/50 to-white",
      text: "text-blue-600",
      iconBg: "bg-blue-100 text-blue-600",
      ring: "ring-blue-500/10",
    },
    emerald: {
      bg: "from-emerald-50/50 to-white",
      text: "text-emerald-600",
      iconBg: "bg-emerald-100 text-emerald-600",
      ring: "ring-emerald-500/10",
    },
    purple: {
      bg: "from-purple-50/50 to-white",
      text: "text-purple-600",
      iconBg: "bg-purple-100 text-purple-600",
      ring: "ring-purple-500/10",
    },
    amber: {
      bg: "from-amber-50/50 to-white",
      text: "text-amber-600",
      iconBg: "bg-amber-100 text-amber-600",
      ring: "ring-amber-500/10",
    },
  }
  const colors = accents[accent]

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{
        backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
      }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              {typeof number === "number" ? number.toLocaleString() : number}
            </h3>
            {spanWord && (
              <span className="text-sm font-medium text-slate-400">
                {spanWord}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs text-slate-500">{description}</p>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  trend.isPositive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <ArrowUpRight
                  className={`h-2.5 w-2.5 ${
                    !trend.isPositive ? "rotate-90" : ""
                  }`}
                />
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.iconBg} ring-1 ${colors.ring} transition-transform group-hover:scale-110`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ---------- Status pill ----------
const StatusPill = ({ isPublished }: { isPublished: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
      isPublished
        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
        : "bg-slate-50 text-slate-600 ring-slate-500/10"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        isPublished ? "bg-emerald-500" : "bg-slate-400"
      }`}
    />
    {isPublished ? "Published" : "Draft"}
  </span>
)

// ---------- Toolbar ----------
type StatusFilter = "all" | "published" | "draft"
type SortOption = "date-desc" | "date-asc" | "views"

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
  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search videos..."
        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>

    <select
      value={status}
      onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
      className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
    >
      <option value="all">All Statuses</option>
      <option value="published">Published</option>
      <option value="draft">Drafts</option>
    </select>

    <select
      value={sort}
      onChange={(e) => onSortChange(e.target.value as SortOption)}
      className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
    >
      <option value="date-desc">Newest First</option>
      <option value="date-asc">Oldest First</option>
      <option value="views">Most Viewed</option>
    </select>

    <div className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-500">
      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-indigo-100 px-2 text-indigo-700 font-bold">
        {totalCount}
      </span>
      <span>total videos</span>
    </div>
  </div>
)

// ---------- Skeleton Loader ----------
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-36 rounded-xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="h-3 w-32 rounded bg-slate-100" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-20 rounded-full bg-slate-200" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 rounded bg-slate-200" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-12 rounded bg-slate-200" />
    </td>
    <td className="px-6 py-4">
      <div className="ml-auto h-8 w-8 rounded-full bg-slate-100" />
    </td>
  </tr>
)

// ---------- Videos table ----------
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FetchOwnerVideosChannelResponse, Error>({
    queryKey: ["videos", "owner", { query, status, sort }],
    queryFn: ({ pageParam }) =>
      fetchOwnerVideosChannel({
        page: pageParam,
        limit: 10,
        query,
        status,
        sort,
      }),
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
      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white">
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
      <div className="rounded-xl border border-red-200 bg-red-50 py-16 text-center text-sm font-medium text-red-600">
        Couldn't load your videos. Please try again.
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-indigo-50 text-indigo-500">
          <VideoIcon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {totalCount === 0 ? "No videos yet" : "No matching videos"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {totalCount === 0
            ? "Your uploaded videos will appear here. Start creating to see them on your channel."
            : "We couldn't find any videos matching your filters. Try adjusting your search."}
        </p>
        {totalCount === 0 && (
          <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md">
            <Plus className="h-4 w-4" /> Upload video
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/30 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="px-6 py-4">Video</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Views</th>
            <th className="px-6 py-4">Duration</th>
            <th className="w-12 px-6 py-4" />
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr
              key={video.videoId}
              className="group border-b border-slate-100 last:border-0 transition-all hover:bg-indigo-50/30 hover:border-l-4 hover:border-l-indigo-500 -ml-1 pl-1"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm shadow-lg">
                        <Play
                          className="h-4 w-4 text-slate-900 ml-0.5"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                    {/* Duration Badge on Thumbnail */}
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {fmtDuration(video.duration)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {video.title}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <img
                        src={video.channelImageUrl}
                        alt=""
                        className="h-4 w-4 rounded-full"
                      />
                      {video.channelTitle}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusPill isPublished={video.isPublished} />
              </td>
              <td className="px-6 py-4 text-sm font-semibold tabular-nums text-slate-700">
                {fmtViews(video.views)}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-500">
                {fmtDuration(video.duration)}
              </td>
              <td className="relative px-6 py-4 text-right">
                <button
                  onClick={() =>
                    setOpenMenuId(
                      openMenuId === video.videoId ? null : video.videoId
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Row actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {openMenuId === video.videoId && (
                  <div className="absolute right-6 top-12 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl ring-1 ring-black/5 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => {
                        onEdit(video.videoId)
                        setOpenMenuId(null)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Edit details
                    </button>
                    <button
                      onClick={() => {
                        onDelete(video.videoId)
                        setOpenMenuId(null)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete video
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasNextPage && (
        <div className="flex justify-center border-t border-slate-100 py-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-100 disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
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

// ---------- Playlists grid ----------
const PlaylistsGrid = ({ playlists }: { playlists: StudioPlaylist[] }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Create Playlist Card */}
      <button className="group flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-slate-400 transition-all hover:border-indigo-400 hover:bg-indigo-50/80 hover:text-indigo-500 hover:shadow-lg hover:-translate-y-1">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition-transform group-hover:scale-110 group-hover:shadow-indigo-100">
          <Plus className="h-7 w-7" />
        </div>
        <div className="text-center">
          <span className="text-sm font-bold">Create new playlist</span>
          <p className="mt-1 text-xs text-slate-500">Organize your content</p>
        </div>
      </button>

      {playlists.length === 0 ? (
        <div className="col-span-full py-16 text-center">
          <Film className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No playlists yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Start organizing your videos by creating your first playlist.
          </p>
        </div>
      ) : (
        playlists.map((pl) => (
          <div
            key={pl.id}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-100">
              <img
                src={pl.thumbnailUrl}
                alt={pl.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm shadow-xl">
                  <Play
                    className="h-6 w-6 text-slate-900 ml-1"
                    fill="currentColor"
                  />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <span className="text-xs font-bold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ListVideo className="h-3 w-3" />
                  {pl.videoCount} videos
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    pl.isPublic
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-200"
                  }`}
                >
                  {pl.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>
            <div className="p-5">
              <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {pl.title}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                Updated recently
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ---------- Page ----------
export const StudioContentPage = () => {
  const [activeTab, setActiveTab] = useState<"videos" | "playlists">("videos")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [sort, setSort] = useState<SortOption>("date-desc")
  const navigate = useNavigate()
  // Fetch stats using a large limit to get overall totals
  const { data: statsData } = useQuery({
    queryKey: ["owner-channel-stats"],
    queryFn: () => fetchOwnerVideosChannel({ page: 1, limit: 1000 }),
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
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hover:text-slate-700 cursor-pointer transition-colors">
              Studio
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-indigo-600">Content</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Channel content
          </h1>
          <p className="text-slate-500">
            Manage your videos, track performance, and organize playlists.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StudioContentCard
            title="Total videos"
            number={stats?.totalVideos ?? 0}
            description={`${stats?.draft ?? 0} drafts remaining`}
            Icon={VideoIcon}
            accent="blue"
            trend={{ value: "+12%", isPositive: true }}
          />
          <StudioContentCard
            title="Total views"
            number={stats?.totalViews ?? 0}
            description="Across all published videos"
            Icon={Eye}
            accent="emerald"
            trend={{ value: "+5.2%", isPositive: true }}
          />
          <StudioContentCard
            title="Published"
            number={stats?.published ?? 0}
            spanWord="videos"
            description="Live on your channel"
            Icon={TrendingUp}
            accent="purple"
          />
          <StudioContentCard
            title="Drafts"
            number={stats?.draft ?? 0}
            spanWord="videos"
            description="Awaiting publish"
            Icon={Clock}
            accent="amber"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "videos"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              Videos
            </div>
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "playlists"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Playlists
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "videos" && (
          <div className="space-y-4">
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
              query={query}
              status={status}
              sort={sort}
              onEdit={(id) => {
                console.log("edit", id)
                navigate(`/studio/content/${id}/edit`)
              }}
              onDelete={(id) => console.log("delete", id)}
            />
          </div>
        )}

        {activeTab === "playlists" && (
          <PlaylistsGrid playlists={MOCK_PLAYLISTS} />
        )}
      </div>
    </div>
  )
}
