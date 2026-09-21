import { useInfiniteQuery } from "@tanstack/react-query"
import { getHistory, type WatchHistoryItem } from "../lib/watchHistory"
import { formatDurationInSeconds, mergeGroupedHistory } from "../lib/helpers"
import { History, Play, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useRef } from "react"

const HistoryCard = ({ item }: { item: WatchHistoryItem }) => {
  const progress = item.video.durationSeconds
    ? Math.min((item.watchedSeconds / item.videoDuration) * 100, 100)
    : 0

  const navigate = useNavigate()
  const channelRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="group flex flex-col sm:flex-row gap-4 p-2 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer"
      onClick={(e) => {
        if (
          channelRef.current &&
          channelRef.current.contains(e.target as Node)
        ) {
          navigate(`/channels/${item.channel.id}`)
        } else {
          navigate(`/videos/${item.video.id}`)
        }
      }}
    >
      {/* Thumbnail Container */}
      <div className="relative w-full sm:w-48 md:w-64 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-sm">
        <img
          src={item.video.thumbnailUrl}
          alt={item.video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-primary-foreground backdrop-blur-sm">
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Watch Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-1 min-w-0 gap-1.5 py-1">
        <div className="flex justify-between gap-2">
          <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {item.video.title}
          </h3>
        </div>

        <div
          className="flex items-center gap-2 text-sm text-muted-foreground mt-1"
          ref={channelRef}
        >
          {/* Channel Avatar */}
          {item.channel.channelImageUrl && (
            <img
              src={item.channel.channelImageUrl}
              alt={item.channel.title}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-border"
            />
          )}
          <span className="font-medium hover:underline hover:text-foreground transition-colors">
            {item.channel.title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDurationInSeconds(item.watchedSeconds)} watched</span>
          </div>
          {item.video.durationSeconds && (
            <>
              <span className="text-border">•</span>
              <span>{formatDurationInSeconds(item.videoDuration)} total</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Skeleton Component for Loading States
const HistorySkeleton = () => (
  <div className="space-y-8 max-w-5xl mx-auto w-full px-4 py-8">
    <div className="flex items-center gap-3">
      <div className="h-7 w-7 bg-muted rounded-md animate-pulse" />
      <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
    </div>
    <div className="space-y-6">
      <div className="h-5 w-24 bg-muted rounded animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-4 p-2">
            <div className="w-full sm:w-48 md:w-64 aspect-video bg-muted rounded-lg animate-pulse" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Empty State Component
const EmptyHistoryState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <History className="w-8 h-8 text-muted-foreground" />
    </div>
    <h2 className="text-xl font-semibold mb-2">Your watch history is empty</h2>
    <p className="text-muted-foreground max-w-sm">
      Videos you watch will show up here so you can easily find them again
      later.
    </p>
  </div>
)

export const HistoryPage = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["history"],
    queryFn: ({ pageParam }) => getHistory(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const lastGroup = lastPage.at(-1)
      const lastItem = lastGroup?.items.at(-1)
      return lastItem?.id
    },
  })

  if (isLoading) return <HistorySkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-destructive">
          Failed to load history
        </h2>
        <p className="text-muted-foreground max-w-sm">
          Something went wrong while fetching your watch history. Please try
          again later.
        </p>
      </div>
    )
  }

  const mergedGroups = mergeGroupedHistory(data?.pages ?? [])

  if (mergedGroups.length === 0) {
    return <EmptyHistoryState />
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <History className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Watch history
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Videos you've watched recently.
          </p>
        </div>
      </div>

      {/* Grouped History Lists */}
      <div className="space-y-10">
        {mergedGroups?.map((group) => (
          <section key={group.label}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span>{group.label}</span>
              <div className="h-px flex-1 bg-border" />
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="
              px-6 py-2.5 rounded-full text-sm font-medium
              bg-secondary text-secondary-foreground hover:bg-secondary/80
              border border-border shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center gap-2
            "
          >
            {isFetchingNextPage ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              "Load more history"
            )}
          </button>
        </div>
      )}
    </div>
  )
}
