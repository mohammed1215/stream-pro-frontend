import {
  Clock,
  Eye,
  Video as VideoIcon,
  Film,
  TrendingUp,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { fetchOwnerVideosChannel } from "../lib/video"
import { useVideo } from "../hooks/useVideo"
import { useDebounce } from "../hooks/useDebounce"
import { cn } from "../lib/utils"
import { StudioContentCard } from "../components/studio/StudioContentCard"
import { staggerContainer } from "../components/studio/studioMotion"
import { ContentToolbar } from "../components/studio/ContentToolbar"
import { VideosView } from "../components/studio/VideosView"
import { PlaylistsGrid } from "../components/studio/PlaylistsGrid"
import type {
  ContentTab,
  SortOption,
  StatusFilter,
  ViewMode,
} from "../components/studio/contentFilters"

export const StudioContentPage = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>("videos")
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 350)
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [sort, setSort] = useState<SortOption>("NEWEST")
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const limit = 10

  const navigate = useNavigate()
  const { deleteVideo } = useVideo()

  // Reset to page 1 in the filter change handlers below (not in an effect),
  // so pagination resets at the moment the user changes a filter.
  const handleQueryChange = (value: string) => {
    setQuery(value)
    setPage(1)
  }
  const handleStatusChange = (value: StatusFilter) => {
    setStatus(value)
    setPage(1)
  }
  const handleSortChange = (value: SortOption) => {
    setSort(value)
    setPage(1)
  }

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
                onQueryChange={handleQueryChange}
                status={status}
                onStatusChange={handleStatusChange}
                sort={sort}
                onSortChange={handleSortChange}
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
