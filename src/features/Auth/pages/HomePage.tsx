import { useQuery } from "@tanstack/react-query"
import { getFeed } from "../../../lib/feed"
import { HomeVideoCard } from "../../../components/HomeVideoCard"

export const HomePage = () => {
  const { data: feed } = useQuery({
    queryKey: ["feed"],
    queryFn: getFeed,
  })

  return (
    <div className="h-screen w-full relative">
      <main className="h-full overflow-y-auto p-4 md:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-10">
          {feed?.sections.map((section) => (
            <section key={section.key}>
              <h2 className="mb-4 text-xl font-bold">{section.title}</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {section.videos.map((video) => (
                  <HomeVideoCard key={video.id ?? video.title} video={video} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
