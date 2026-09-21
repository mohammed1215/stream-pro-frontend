import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Loader2,
  MoreVertical,
  Search,
  SearchX,
  Share2,
  Sparkles,
} from "lucide-react"

import { searchVideos } from "../../../lib/search"
import type { SearchResponse, VideoResponse } from "../../../lib/search"

import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"
import { formatDurationInSeconds, formatNumber } from "../../../lib/helpers"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useAuth } from "../../Auth/hooks/useAuth"

import { toast } from "react-toastify"
import { PlaylistIcon } from "@vidstack/react/icons"
import { createPortal } from "react-dom"
import { CreatePlaylistModal } from "../../../components/CreatePlaylistModal"
import { SaveDropdown } from "../../../components/features/SaveDropdown"
import axiosInstance from "../../../lib/api"

dayjs.extend(relativeTime)

const PAGE_SIZE = 12

const HOVER_COLORING = [
  "hover:bg-destructive/10 dark:hover:bg-destructive/15",
  "hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15",
  "hover:bg-sky-500/10 dark:hover:bg-sky-500/15",
  "hover:bg-amber-500/10 dark:hover:bg-amber-500/15",
  "hover:bg-violet-500/10 dark:hover:bg-violet-500/15",
  "hover:bg-primary/90/10 dark:hover:bg-primary/90/15",
]

function getSafePage(value: string | null) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1
  }

  return Math.floor(parsed)
}

function PaginationControls({
  currentPage,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  disabled,
  className,
}: {
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1 rounded-full px-3 font-semibold"
        disabled={!hasPrevPage || disabled}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <span className="min-w-16 rounded-full bg-muted/70 px-3 py-1.5 text-center text-xs font-bold text-foreground/80">
        Page {currentPage}
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1 rounded-full px-3 font-semibold"
        disabled={!hasNextPage || disabled}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <ul className="flex w-full flex-col gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={`search-skeleton-${index}`}
          className="animate-pulse rounded-2xl border border-border/50 bg-card/30 p-3"
        >
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="aspect-video w-full shrink-0 rounded-xl bg-muted sm:w-72 lg:w-80 xl:w-96" />

            <div className="flex flex-1 flex-col justify-between gap-4 p-1">
              <div className="space-y-3">
                <div className="h-6 w-3/4 rounded-md bg-muted" />
                <div className="h-4 w-1/2 rounded-md bg-muted" />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded-md bg-muted" />
                  <div className="h-3 w-20 rounded-md bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyQueryState() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-3 text-2xl font-bold">Discover videos</h2>

      <p className="max-w-md text-muted-foreground">
        Start typing in the search bar to find videos by title, channel, topic,
        or keyword.
      </p>
    </div>
  )
}

function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>

      <h2 className="mb-3 text-2xl font-bold">No results found</h2>

      <p className="mb-2 text-muted-foreground">
        We couldn&apos;t find any videos matching{" "}
        <span className="font-semibold text-foreground">“{query}”</span>.
      </p>

      <p className="max-w-md text-sm text-muted-foreground/80">
        Try different keywords, check your spelling, or search for something
        more general.
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>

      <h2 className="mb-3 text-2xl font-bold">Search failed</h2>

      <p className="mb-6 max-w-md text-muted-foreground">
        Something went wrong while fetching search results. Please check your
        connection and try again.
      </p>

      <Button onClick={onRetry} className="rounded-full px-6 font-semibold">
        Try again
      </Button>
    </div>
  )
}

function SearchVideoDropdown({ videoId }: { videoId: string }) {
  const user = useAuth((state) => state.user)
  const [openPlaylistDropdown, setOpenPlaylistDropdown] = useState(false)

  return (
    // CRITICAL: Stop propagation so clicking the menu background doesn't navigate the card
    <div className="py-1" onClick={(e) => e.stopPropagation()}>
      {/* Watch Later */}
      <button
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
        onClick={() => {
          toast.info("Added to Watch Later")
        }}
      >
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>Save to watch later</span>
      </button>

      {/* Save to Playlist (Nested) */}
      <div className="relative px-2">
        <button
          className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
          onClick={() =>
            user
              ? setOpenPlaylistDropdown(!openPlaylistDropdown)
              : toast.error("Login to save videos")
          }
          aria-expanded={openPlaylistDropdown}
        >
          <PlaylistIcon className="h-4 w-4 text-muted-foreground" />
          <span>Save to playlist</span>
        </button>

        {/* The Nested Dropdown */}
        <SaveDropdown
          videoId={videoId}
          isOpen={openPlaylistDropdown}
          onClose={() => setOpenPlaylistDropdown(false)}
        />
      </div>

      {/* Share */}
      <button
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
        onClick={() => {
          toast.info("Share feature coming soon")
        }}
      >
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <span>Share</span>
      </button>

      {/* Divider */}
      <div className="my-1 border-t border-border/50" />

      {/* Report (Danger Styling) */}
      <button
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none"
        onClick={() => {
          toast.info("Report feature coming soon")
        }}
      >
        <Flag className="h-4 w-4" />
        <span>Report</span>
      </button>
    </div>
  )
}

function SearchVideoCard({
  video,
  hoverColoring,
}: {
  video: VideoResponse
  hoverColoring: string
}) {
  const [openSearchVideoDropdown, setOpenSearchVideoDropdown] = useState(false)

  const navigate = useNavigate()

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement

    if (target.closest('button, a, input, [role="button"], [role="menu"]')) {
      return
    }

    navigate(`/videos/${video.videoId}`)
  }

  return (
    <div
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          navigate(`/videos/${video.videoId}`)
        }
      }}
      aria-label={`Watch ${video.title} by ${video.channelName}`}
      className={cn(
        "group flex w-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-3 shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-border/90 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "sm:flex-row sm:gap-5",
        hoverColoring
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-72 lg:w-80 xl:w-96">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={`${video.title} thumbnail`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Search className="h-8 w-8" />
          </div>
        )}

        {/* Thumbnail overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Duration badge */}
        {video.durationSeconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
            {formatDurationInSeconds(video.durationSeconds)}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-1">
        <div className="flex justify-between">
          <div>
            <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary lg:text-xl">
              {video.title}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted/70 px-2.5 py-1 font-semibold">
                {formatNumber(video.views)} views
              </span>

              <span className="rounded-full bg-muted/70 px-2.5 py-1 font-semibold">
                {dayjs(video.updatedAt).fromNow()}
              </span>
            </div>
          </div>

          {/* Button & Drop Down */}
          <div className="relative">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 group-hover:text-primary"
              onClick={() => setOpenSearchVideoDropdown((prev) => !prev)}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {openSearchVideoDropdown && (
              <>
                {/* 1. Invisible Backdrop (Closes menu when clicking outside) */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenSearchVideoDropdown(false)}
                />

                {/* 2. The Floating Menu Panel */}
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-background shadow-xl z-20  animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-right"
                >
                  <SearchVideoDropdown videoId={video.videoId} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Channel */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {video.channelProfileImageUrl ? (
              <img
                src={video.channelProfileImageUrl}
                alt={`${video.channelName} avatar`}
                loading="lazy"
                decoding="async"
                className="h-10 w-10 shrink-0 rounded-full border border-border/60 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-bold">
                {video.channelName?.charAt(0)?.toUpperCase() || "C"}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground/90">
                {video.channelName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Updated {dayjs(video.updatedAt).fromNow()}
              </p>
            </div>
          </div>

          <span className="hidden shrink-0 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-bold text-foreground/80 transition-colors group-hover:border-primary/40 group-hover:text-primary sm:inline-flex">
            Watch
          </span>
        </div>
      </div>
    </div>
  )
}

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedCategory = searchParams.get("category") ?? ""
  const query = searchParams.get("q") ?? ""
  const page = getSafePage(searchParams.get("page"))

  const lastQueryRef = useRef(query)

  const { data, isPending, isError, isFetching, refetch } =
    useQuery<SearchResponse>({
      queryKey: ["videos", "search", query, page, selectedCategory],
      queryFn: ({ signal }) =>
        searchVideos(query, page, PAGE_SIZE, selectedCategory, signal),
      enabled: query.trim().length > 0,
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    })
  const { data: categories } = useQuery({
    queryKey: ["videos", "categories"],
    queryFn: async () => {
      const response = await axiosInstance.get<
        {
          id: string
          name: string
        }[]
      >("/api/v1/categories")
      return response.data
    },
  })

  useEffect(() => {
    document.title = query ? `${query} - Search` : "Search"

    // Reset page back to 1 when the search query changes.
    if (lastQueryRef.current !== query) {
      lastQueryRef.current = query

      if (page !== 1) {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete("page")
        setSearchParams(nextParams, { replace: true })
      }
    }
  }, [query, page, searchParams, setSearchParams])

  const updatePage = (newPage: number) => {
    if (newPage < 1) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", String(newPage))

    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const items = data?.items ?? []
  // const currentPageSize = data?.pageSize || PAGE_SIZE

  const hasPrevPage = page > 1
  const hasNextPage = data?.hasNextPage ?? false

  const showResults = query.trim().length > 0
  const showPagination = showResults && items.length > 0

  const handleCategoryChange = (categoryName: string | null) => {
    const nextParams = new URLSearchParams(searchParams)

    nextParams.delete("page")

    if (categoryName) {
      nextParams.set("category", categoryName)
    } else {
      nextParams.delete("category")
    }

    setSearchParams(nextParams)
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Subtle top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.045] to-transparent" />

      {/* Wider page container */}
      <div className="relative mx-auto w-full max-w-[1750px] px-4 py-8 md:px-8 xl:px-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
                <button
                  type="button"
                  onClick={() => {
                    handleCategoryChange(null)
                  }}
                  className={cn(
                    "shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                    !selectedCategory
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-muted/80 text-foreground/80 hover:bg-muted hover:text-foreground"
                  )}
                >
                  All
                </button>

                {categories?.map((category) => {
                  const isSelected = selectedCategory === category.name

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        handleCategoryChange(category.name)
                      }}
                      className={cn(
                        "shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                        isSelected
                          ? "bg-foreground text-background shadow-sm"
                          : "bg-muted/80 text-foreground/80 hover:bg-muted hover:text-foreground active:scale-95"
                      )}
                    >
                      {category.name}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {isFetching && !isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Search className="h-4 w-4" />
                )}

                <span className="text-xs font-bold uppercase tracking-wider">
                  {isFetching && !isPending
                    ? "Updating results"
                    : "Search results"}
                </span>
              </div>

              {query ? (
                <>
                  <h1 className="max-w-5xl break-words text-3xl font-bold tracking-tight md:text-4xl">
                    Results for <span className="text-primary">“{query}”</span>
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    {isFetching && !isPending
                      ? "Refreshing search results..."
                      : data
                      ? `Showing ${items.length} ${
                          items.length === 1 ? "video" : "videos"
                        } on page ${data.pageNumber || page}.`
                      : "Find videos by title, channel, or topic."}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
                    <Sparkles className="h-7 w-7 text-primary" />
                    Discover videos
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    Search for videos, channels, topics, and more.
                  </p>
                </>
              )}
            </div>

            {showPagination && (
              <PaginationControls
                currentPage={page}
                hasPrevPage={hasPrevPage}
                hasNextPage={hasNextPage}
                onPageChange={updatePage}
                disabled={isFetching}
              />
            )}
          </div>
        </header>

        {/* Body */}
        {!query ? (
          <EmptyQueryState />
        ) : isPending ? (
          <SearchSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptySearchState query={query} />
        ) : (
          <>
            <ul
              className={cn(
                "flex w-full flex-col gap-5 transition-opacity duration-200",
                isFetching && !isPending && "opacity-60"
              )}
            >
              {items.map((video, index) => (
                <li
                  key={video.videoId}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{
                    animationDelay: `${index * 40}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <SearchVideoCard
                    video={video}
                    hoverColoring={
                      HOVER_COLORING[index % HOVER_COLORING.length]
                    }
                  />
                </li>
              ))}
            </ul>

            {showPagination && (
              <div className="mt-10 flex justify-center">
                <PaginationControls
                  currentPage={page}
                  hasPrevPage={hasPrevPage}
                  hasNextPage={hasNextPage}
                  onPageChange={updatePage}
                  disabled={isFetching}
                />
              </div>
            )}
          </>
        )}
      </div>
      {createPortal(<CreatePlaylistModal />, document.body)}
    </div>
  )
}
