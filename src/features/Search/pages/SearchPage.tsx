import { Link, useSearchParams } from "react-router-dom"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { searchVideos } from "../../../lib/search"
import { VideoSearchCard } from "../../../components/VideoSearchCard"
import { Loader2 } from "lucide-react"

const HOVER_COLORING = [
  "hover:bg-rose-500/10 dark:hover:bg-rose-500/15",
  "hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15",
  "hover:bg-sky-500/10 dark:hover:bg-sky-500/15",
  "hover:bg-amber-500/10 dark:hover:bg-amber-500/15",
  "hover:bg-violet-500/10 dark:hover:bg-violet-500/15",
  "hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15",
]

export const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""

  const { data, isPending, isError } = useQuery({
    queryKey: ["videos", "search", query],
    queryFn: ({ signal }) => searchVideos(query, signal),
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
  })

  return (
    <>
      <div className="p-4">
        <span className="text-xs font-semibold text-gray-300">
          {query ? `Search results for “${query}”` : "Search"}
        </span>

        {isPending ? (
          <p className="w-full h-full flex justify-center items-center">
            <Loader2 className="animate-spin" />
          </p>
        ) : isError ? (
          <p>Failed to load videos.</p>
        ) : data?.items.length === 0 ? (
          <p>No videos found.</p>
        ) : (
          <ul className="w-full flex flex-col gap-4 mt-4">
            {data?.items.map((video, index) => (
              <li key={video.videoId}>
                <Link to={`/videos/${video.videoId}`} className="w-full block">
                  <VideoSearchCard
                    video={video}
                    hoverColoring={
                      HOVER_COLORING[index % HOVER_COLORING.length]
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
