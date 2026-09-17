import { useInfiniteQuery } from "@tanstack/react-query"
import { getWatchLater, type WatchLaterItem } from "../lib/watchlater"
import { useAuth } from "../features/Auth/hooks/useAuth"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  Clock,
  Play,
  Shuffle,
  Trash2,
  AlertCircle,
  ListVideo,
} from "lucide-react"
import { useMemo, useState } from "react"
import { formatDurationInSeconds, formatNumber } from "../lib/helpers"
import { useNavigate } from "react-router-dom"

// Initialize dayjs relative time plugin
dayjs.extend(relativeTime)

// --- Sub Components ---

const VideoCard = ({
  item,
  index,
}: {
  item: WatchLaterItem
  index: number
}) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <div
      className="group flex flex-col sm:flex-row gap-4 p-2 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Index Number / Play Icon */}
      <div className="hidden sm:flex w-8 items-center justify-center text-muted-foreground font-medium text-lg select-none">
        {isHovered ? (
          <Play className="w-5 h-5 text-foreground" fill="currentColor" />
        ) : (
          <span className="text-muted-foreground/70">{index + 1}</span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative w-full sm:w-48 md:w-64 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-sm">
        <img
          src={item.video.thumbnailUrl}
          alt={item.video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Duration Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
          {formatDurationInSeconds(item.video.durationSeconds)}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0 gap-1.5 py-1 pr-8 sm:pr-0">
        <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {item.video.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span className="font-medium hover:underline hover:text-foreground transition-colors">
            {item.video.channel.title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{formatNumber(item.video.views)}</span>
          <span className="text-border">•</span>
          <span>{dayjs(item.video.createdAt).fromNow()}</span>
        </div>
      </div>

      {/* Remove Button */}
      <button
        className="absolute top-2 right-2 sm:static sm:ml-auto p-2 rounded-full hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-destructive"
        title="Remove from Watch Later"
        onClick={(e) => {
          e.stopPropagation()
          // Add removal logic here
        }}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

const WatchLaterSkeleton = () => (
  <div className="max-w-7xl mx-auto w-full px-4 py-8">
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div className="aspect-square bg-muted rounded-xl animate-pulse" />
        <div className="flex gap-3">
          <div className="flex-1 h-11 bg-muted rounded-full animate-pulse" />
          <div className="w-16 h-11 bg-muted rounded-full animate-pulse" />
        </div>
      </aside>
      <div className="flex-1 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 p-2">
            <div className="hidden sm:block w-8 h-6 bg-muted rounded animate-pulse self-center" />
            <div className="w-full sm:w-48 md:w-64 aspect-video bg-muted rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const ErrorState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5 max-w-3xl mx-auto">
    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-destructive" />
    </div>
    <h2 className="text-xl font-semibold mb-2 text-destructive">
      Failed to load playlist
    </h2>
    <p className="text-muted-foreground max-w-sm">
      We couldn't fetch your Watch Later videos. Please check your connection
      and try again.
    </p>
  </div>
)

const EmptyWatchLaterState = () => {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-accent/20">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 shadow-sm">
        <Clock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">
        Your Watch Later list is empty
      </h2>
      <p className="text-muted-foreground max-w-sm mb-6">
        Save videos to watch later by clicking the clock icon on any video.
      </p>
      <button
        onClick={() => {
          navigate("/")
        }}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm"
      >
        Discover Videos
      </button>
    </div>
  )
}

// --- Main Component ---

export const WatchLaterPage = () => {
  const user = useAuth((state) => state.user)
  const {
    data: watchLater,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // Added user?.id to queryKey to prevent stale data on login/logout
    queryKey: ["watchLater", user?.id],
    queryFn: ({ pageParam }) => getWatchLater(20, pageParam),
    getNextPageParam: (lastPage) => {
      const lastItem = lastPage.items.at(-1)
      return lastItem?.id
    },
    initialPageParam: undefined as string | undefined,
  })

  const navigate = useNavigate()

  const allItems = useMemo(
    () => watchLater?.pages.flatMap((page) => page.items) ?? [],
    [watchLater]
  )
  const videoCount = watchLater?.pages[0]?.videoCount ?? allItems.length

  if (isLoading) return <WatchLaterSkeleton />
  if (isError) return <ErrorState />

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Side: Sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* Playlist Cover */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted shadow-2xl shadow-black/20">
              {allItems.length > 0 ? (
                <img
                  src={allItems[0].video.thumbnailUrl}
                  alt="Watch Later Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                  <Clock className="w-16 h-16 opacity-50" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Overlay Text */}
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <ListVideo className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Playlist
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight leading-tight">
                  Watch Later
                </h1>
                <div className="flex items-center gap-2 mt-3 text-sm text-white/80">
                  <img
                    src={
                      user?.avatarUrl ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    }
                    alt={user?.name}
                    className="w-6 h-6 rounded-full ring-1 ring-white/20"
                  />
                  <span>{user?.name}</span>
                  <span className="text-white/40">•</span>
                  <span>{videoCount} videos</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  navigate(`/videos/${allItems[0].video.id}?list=WLP`)
                }
                disabled={allItems.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2.5 font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4" fill="currentColor" />
                Play All
              </button>
              <button className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border rounded-full px-4 py-2.5 font-medium hover:bg-secondary/80 transition-colors">
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Right Side: Videos List */}
        <div className="flex-1 min-w-0">
          {allItems.length === 0 ? (
            <EmptyWatchLaterState />
          ) : (
            <div className="space-y-4">
              {allItems.map((item, index) => (
                <VideoCard key={item.id} item={item} index={index} />
              ))}

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6 py-2.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Loading more...
                      </>
                    ) : (
                      "Load more videos"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
