import { Fragment, useEffect, useRef } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { ListVideo, Play } from "lucide-react"
import {
  fetchChannelHome,
  fetchChannelPlaylists,
  fetchChannelVideos,
} from "../../lib/channel"
import { ApertureLoader } from "../AperturLoader"
import { gridContainerVariants } from "./channelVariants"
import {
  ChannelPlaylistItem,
  ChannelVideoItem,
  EmptyState,
} from "./ChannelCards"

export const ChannelHomeTab = ({
  channelId,
  isOwner,
}: {
  channelId?: string
  isOwner?: boolean
}) => {
  const { data: homeData, isPending } = useQuery({
    queryKey: ["channels", channelId, "home"],
    queryFn: ({ signal }) => {
      if (!channelId) throw new Error("Channel ID is missing")
      return fetchChannelHome(channelId, signal)
    },
  })

  if (isPending) {
    return <ApertureLoader label="Loading channel..." />
  }

  if (
    !homeData ||
    (homeData.videos.length === 0 && homeData.playlists.length === 0)
  ) {
    return <EmptyState message="This channel hasn't posted any content yet." />
  }

  return (
    <div className="channel-tab-content">
      {homeData.videos.length > 0 && (
        <section className="channel-section">
          <div className="section-header">
            <Play size={20} className="text-accent" fill="currentColor" />
            <h2>Latest Uploads</h2>
          </div>
          <motion.div
            className="channel-grid"
            variants={gridContainerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {homeData.videos.map((video) => (
                <ChannelVideoItem
                  key={video.videoId}
                  video={video}
                  isOwner={isOwner}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {homeData.playlists.length > 0 && (
        <section className="channel-section">
          <div className="section-header">
            <ListVideo size={20} className="text-accent" />
            <h2>Created Playlists</h2>
          </div>
          <motion.div
            className="channel-grid"
            variants={gridContainerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {homeData.playlists.map((playlist) => (
                <ChannelPlaylistItem key={playlist.id} playlist={playlist} />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      )}
    </div>
  )
}

export const ChannelVideosTab = ({
  channelId,
  isOwner,
}: {
  channelId?: string
  isOwner?: boolean
}) => {
  const scrollDom = useRef<HTMLDivElement>(null)
  const {
    data: channelVideos,
    isPending,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["channels", channelId, "videos"],
    queryFn: ({ pageParam, signal }) => {
      if (!channelId) throw new Error("Channel ID is missing")
      return fetchChannelVideos(
        channelId,
        { pageNumber: pageParam, pageSize: 12 },
        signal
      )
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined,
    initialPageParam: 1,
  })

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 500 &&
        hasNextPage
      ) {
        fetchNextPage()
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [fetchNextPage, hasNextPage])

  if (isPending) {
    return <div className="channel-skeleton-grid" />
  }

  const hasVideos = channelVideos && channelVideos.pages[0]?.items.length > 0

  if (!hasVideos) {
    return <EmptyState message="No videos uploaded yet." />
  }

  return (
    <motion.div
      className="channel-grid"
      ref={scrollDom}
      variants={gridContainerVariants}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence>
        {channelVideos.pages.map((page, index) => (
          <Fragment key={index}>
            {page.items.map((video) => (
              <ChannelVideoItem
                key={video.videoId}
                video={video}
                isOwner={isOwner}
              />
            ))}
          </Fragment>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export const ChannelPlaylistsTab = ({ channelId }: { channelId?: string }) => {
  const { data: channelPlaylists, isPending } = useInfiniteQuery({
    queryKey: ["channels", channelId, "playlists"],
    queryFn: ({ pageParam, signal }) => {
      if (!channelId) throw new Error("Channel ID is missing")
      return fetchChannelPlaylists(
        channelId,
        { pageNumber: pageParam, pageSize: 12 },
        signal
      )
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined,
    initialPageParam: 1,
  })

  if (isPending) {
    return <div className="channel-skeleton-grid" />
  }

  const hasPlaylists =
    channelPlaylists && channelPlaylists.pages[0]?.items.length > 0

  if (!hasPlaylists) {
    return <EmptyState message="No playlists found." icon={ListVideo} />
  }

  return (
    <motion.div
      className="channel-grid"
      variants={gridContainerVariants}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence>
        {channelPlaylists.pages.map((page, index) => (
          <Fragment key={index}>
            {page.items.map((playlist) => (
              <ChannelPlaylistItem key={playlist.id} playlist={playlist} />
            ))}
          </Fragment>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
