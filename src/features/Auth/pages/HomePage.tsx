import { useEffect, useRef } from "react"
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query"
import { getFeed, type FeedResponse } from "../../../lib/feed"
import { HomeVideoCard } from "../../../components/HomeVideoCard"

export const HomePage = () => {
  const {
    data: feed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    FeedResponse[],
    Error,
    InfiniteData<FeedResponse[]>,
    string[],
    string[]
  >({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => getFeed({ excludeIds: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0) return undefined
      return allPages.flatMap((page) => page.map((video) => video.id))
    },
    initialPageParam: [] as string[],
  })

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: "300px" }
    )

    const element = loadMoreRef.current
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="min-h-screen w-full relative">
      <main className="p-4 md:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {feed?.pages
              .flatMap((page) => page)
              .map((video) => (
                <HomeVideoCard key={video.id ?? video.title} video={video} />
              ))}
          </div>

          <div ref={loadMoreRef} className="flex justify-center py-6">
            {isFetchingNextPage && (
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
