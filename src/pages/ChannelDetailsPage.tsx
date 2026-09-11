import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import {
  fetchChannelData,
  fetchChannelHome,
  fetchChannelPlaylists,
  fetchChannelVideos,
  type FetchChannelPlaylistsResponse,
  type FetchChannelVideosResponse,
} from "../lib/channel"
import { toast } from "react-toastify"
import "./ChannelDetailsPage.css"
import { formatNumber } from "../lib/helpers"
import { Fragment, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, type Variants } from "motion/react"
import {
  Bell,
  Check,
  Clock,
  Film,
  Globe,
  Heart,
  Layers,
  ListVideo,
  Lock,
  Play,
  Share2,
  SlidersHorizontal,
  Video,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  subscribeToChannel,
  unsubscribeToChannel,
} from "../lib/subscriptionApi"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { ApertureLoader } from "../components/AperturLoader"
import { VideoActionMenu } from "../components/VideoActionMenu"

dayjs.extend(relativeTime)

interface ChannelData {
  title: string
  description?: string
  thumbnailUrl?: string
  channelImageUrl: string
  subscriptionsCount: number
  videosCount: number
  totalViews: number
  isSubscribed: boolean
  isOwner: boolean
  createdAt: string
}

const gridContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const tabPanelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" } },
}

const ChannelButtons = ({
  isSubscribed,
  isOwner,
  channelId,
}: {
  isSubscribed: boolean
  isOwner: boolean
  channelId?: string
}) => {
  const navigate = useNavigate()
  const url = window.location.href
  const queryClient = useQueryClient()

  const { mutate: toggleSubscribe, isPending } = useMutation({
    mutationFn: async (isSubscribed: boolean) => {
      if (!channelId) {
        toast.error("Channel ID is missing", { position: "top-center" })
        return
      }
      return isSubscribed
        ? unsubscribeToChannel(channelId)
        : subscribeToChannel(channelId)
    },
    onMutate: async (isSubscribed: boolean) => {
      await queryClient.cancelQueries({ queryKey: ["channels", channelId] })

      const previousChannelData = queryClient.getQueryData<ChannelData>([
        "channels",
        channelId,
      ])

      queryClient.setQueryData<ChannelData>(
        ["channels", channelId],
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            isSubscribed: !isSubscribed,
            subscriptionsCount: isSubscribed
              ? oldData.subscriptionsCount - 1
              : oldData.subscriptionsCount + 1,
          }
        }
      )
      return { previousChannelData }
    },
    onError: (_err, _isSubscribed, context) => {
      if (context?.previousChannelData) {
        queryClient.setQueryData(
          ["channels", channelId],
          context.previousChannelData
        )
      }
      toast.error("Something went wrong", { position: "top-center" })
    },
    onSuccess: (_data, isSubscribed: boolean) => {
      toast.success(
        isSubscribed ? "Unsubscribed from channel" : "Subscribed to channel",
        {
          style: { borderRadius: "20rem" },
          hideProgressBar: true,
          position: "top-center",
        }
      )
      queryClient.invalidateQueries({ queryKey: ["channels", channelId] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", channelId] })
    },
  })

  return (
    <div className="channel-actions-group">
      {!isOwner ? (
        <>
          <motion.button
            disabled={isPending}
            className={`btn-action ${
              isSubscribed ? "btn-subscribed" : "btn-subscribe"
            }`}
            onClick={() => toggleSubscribe(isSubscribed)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSubscribed ? (
                <motion.span
                  key="subscribed"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Check size={18} />
                  <span>Subscribed</span>
                </motion.span>
              ) : (
                <motion.span
                  key="subscribe"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Bell size={18} />
                  <span>Subscribe</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            className="btn-action btn-secondary"
            disabled={!url}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              navigator.clipboard.writeText(url)
              toast.success("Channel URL copied to clipboard!", {
                style: { borderRadius: "20rem" },
                hideProgressBar: true,
                position: "bottom-center",
                closeButton(props) {
                  return (
                    <button
                      onClick={props.closeToast}
                      className="ml-3 rounded-full text-sm!"
                    >
                      <X size={15} />
                    </button>
                  )
                },
              })
            }}
          >
            <Share2 size={18} />
            <span>Share</span>
          </motion.button>
        </>
      ) : (
        <>
          <motion.button
            className="btn-action btn-primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() =>
              navigate(`/studio/channel/${channelId}/customization`)
            }
          >
            <SlidersHorizontal size={18} />
            <span>Customize Channel</span>
          </motion.button>
          <motion.button
            className="btn-action btn-secondary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/studio/channel/${channelId}/videos`)}
          >
            <Video size={18} />
            <span>Manage Videos</span>
          </motion.button>
        </>
      )}
    </div>
  )
}

type VideoType = FetchChannelVideosResponse["items"][0]
type PlaylistType = FetchChannelPlaylistsResponse["items"][0]

const ChannelVideoItem = ({
  video,
  isOwner = false,
}: {
  video: VideoType
  isOwner?: boolean
}) => {
  const navigate = useNavigate()

  return (
    <motion.div
      className="channel-card video-card group"
      variants={cardItemVariants}
      layout
      whileHover={{ y: -4 }}
      whileTap={{ y: -1, scale: 0.99 }}
      onClick={() => navigate(`/videos/${video.videoId}`)}
    >
      <div className="card-thumbnail-wrapper">
        <img
          className="card-thumbnail-img"
          src={video.thumbnailUrl}
          alt={video.videoTitle}
          loading="lazy"
        />

        <div className="card-top-actions" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {video.isLikedByUser && (
              <motion.span
                className="card-badge liked-badge"
                title="Liked by you"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Heart size={13} fill="currentColor" />
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button
            className={`quick-action-btn ${
              video.isInWatchLater ? "active" : ""
            }`}
            title={
              video.isInWatchLater ? "In Watch Later" : "Save to Watch Later"
            }
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <Clock size={14} />
          </motion.button>
        </div>

        <div className="card-overlay">
          <motion.div
            className="play-icon-badge"
            initial={{ scale: 0.7 }}
            whileHover={{ scale: 1 }}
          >
            <Play size={20} fill="currentColor" />
          </motion.div>
        </div>
      </div>

      <div className="card-content">
        <div className="card-title-row">
          <h3 className="card-title" title={video.videoTitle}>
            {video.videoTitle}
          </h3>

          {/* Action Menu (stops bubbling to card click) */}
          <div
            className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoActionMenu
              video={{
                id: video.videoId,
                title: video.videoTitle,
                thumbnailUrl: video.thumbnailUrl,
              }}
              isOwner={isOwner}
              onEdit={() => navigate(`/studio/content/${video.videoId}/edit`)}
              onDelete={() => {
                // Delete mutation call
              }}
            />
          </div>
        </div>

        <div className="card-meta">
          <span>{formatNumber(video.views)} views</span>
          <span className="dot-divider">•</span>
          <span>{dayjs(video.createdAt).fromNow()}</span>
        </div>
      </div>
    </motion.div>
  )
}

const ChannelPlaylistItem = ({
  playlist,
  isOwner = false,
}: {
  playlist: PlaylistType
  isOwner?: boolean
}) => {
  const navigate = useNavigate()
  const isEmpty = playlist.videosCount === 0

  const handleClick = () => {
    if (isEmpty) return
    navigate(`/playlist?list=${playlist.id}`)
  }

  return (
    <motion.div
      className={`channel-card playlist-card ${isEmpty ? "is-empty" : ""}`}
      variants={cardItemVariants}
      layout
      whileHover={isEmpty ? undefined : { y: -4 }}
      whileTap={isEmpty ? undefined : { y: -1, scale: 0.99 }}
      onClick={handleClick}
      role={isEmpty ? "presentation" : "button"}
      tabIndex={isEmpty ? -1 : 0}
    >
      <div className="card-thumbnail-wrapper">
        <div className="playlist-thumbnail-fallback">
          <ListVideo size={36} className="text-accent" />
        </div>

        {isOwner && (
          <div className="playlist-visibility-badge">
            {playlist.isPublic ? (
              <span title="Public Playlist">
                <Globe size={13} /> Public
              </span>
            ) : (
              <span title="Private Playlist">
                <Lock size={13} /> Private
              </span>
            )}
          </div>
        )}

        <div className={`playlist-count-badge ${isEmpty ? "empty-badge" : ""}`}>
          <Layers size={14} />
          <span>
            {isEmpty
              ? "0 videos (Empty)"
              : `${playlist.videosCount} ${
                  playlist.videosCount === 1 ? "video" : "videos"
                }`}
          </span>
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title" title={playlist.title}>
          {playlist.title}
        </h3>
        {playlist.description && (
          <p className="card-description">{playlist.description}</p>
        )}
        <div className="card-meta">
          <span>Updated {dayjs(playlist.updatedAt).fromNow()}</span>
        </div>
      </div>
    </motion.div>
  )
}

const EmptyState = ({
  message,
  icon: Icon = Film,
}: {
  message: string
  icon?: LucideIcon
}) => (
  <motion.div
    className="channel-empty-state"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Icon size={48} className="empty-icon" />
    <p>{message}</p>
  </motion.div>
)

const ChannelHomeTab = ({
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

const ChannelVideosTab = ({
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

const ChannelPlaylistsTab = ({ channelId }: { channelId?: string }) => {
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

const ChannelAboutTab = ({ channelData }: { channelData: ChannelData }) => {
  return (
    <div className="channel-about-container">
      <div className="about-details-card">
        <h3>Description</h3>
        <p className="about-full-description">
          {channelData?.description || "No description provided."}
        </p>
      </div>
      <div className="about-stats-card">
        <h3>Stats</h3>
        <div className="about-stat-item">
          <span>Joined</span>
          <span>{dayjs(channelData?.createdAt).format("MMM D, YYYY")}</span>
        </div>
        <div className="about-stat-item">
          <span>Total Views</span>
          <span>{formatNumber(channelData?.totalViews)}</span>
        </div>
        <div className="about-stat-item">
          <span>Subscribers</span>
          <span>{formatNumber(channelData?.subscriptionsCount)}</span>
        </div>
        <div className="about-stat-item">
          <span>Videos</span>
          <span>{channelData?.videosCount}</span>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { key: "home", label: "Home" },
  { key: "videos", label: "Videos" },
  { key: "playlists", label: "Playlists" },
  { key: "about", label: "About" },
] as const

export const ChannelDetailsPage = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const [openDescription, setOpenDescription] = useState(false)
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["key"]>("home")

  const { data: channelData, isPending } = useQuery({
    queryKey: ["channels", channelId],
    queryFn: ({ signal }) => {
      if (!channelId) throw new Error("Channel ID is missing")
      return fetchChannelData(channelId, signal)
    },
  })

  if (isPending) {
    return <div className="channel-page-loading">Loading channel...</div>
  }

  if (!channelData) {
    return (
      <div className="channel-page-error">
        <h2>Channel Not Found</h2>
        <p>
          The channel you are looking for does not exist or has been removed.
        </p>
      </div>
    )
  }

  const characterLimit = 120
  const characters = channelData.description?.length || 0
  const shouldTruncate = characters > characterLimit && !openDescription
  const truncatedDescription = shouldTruncate
    ? channelData.description.slice(0, characterLimit) + "..."
    : channelData.description

  return (
    <motion.div
      className="channel-page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Banner / Cover */}
      <div className="channel-banner-container">
        {channelData.thumbnailUrl ? (
          <motion.img
            src={channelData.thumbnailUrl}
            alt={channelData.title}
            className="channel-banner-img"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ) : (
          <div className="channel-banner-placeholder" />
        )}
      </div>

      {/* Header Info Section */}
      <div className="channel-header-container">
        <div className="channel-header-content">
          <motion.div
            className="channel-avatar-wrapper"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.1,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <img
              src={channelData.channelImageUrl}
              alt={channelData.title}
              className="channel-avatar-img"
            />
          </motion.div>

          <motion.div
            className="channel-main-meta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h1 className="channel-main-title">{channelData.title}</h1>

            <div className="channel-quick-stats">
              <span>
                {formatNumber(channelData.subscriptionsCount)} subscribers
              </span>
              <span className="dot-divider">•</span>
              <span>{channelData.videosCount} videos</span>
              <span className="dot-divider">•</span>
              <span>{formatNumber(channelData.totalViews)} views</span>
            </div>

            {channelData.description && (
              <div className="channel-desc-box">
                <p className="channel-desc-text">
                  {truncatedDescription}
                  {characters > characterLimit && (
                    <button
                      className="desc-toggle-btn"
                      onClick={() => setOpenDescription(!openDescription)}
                    >
                      {openDescription ? " Show less" : " more"}
                    </button>
                  )}
                </p>
              </div>
            )}

            <ChannelButtons
              isSubscribed={channelData.isSubscribed}
              isOwner={channelData.isOwner}
              channelId={channelId}
            />
          </motion.div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="channel-tabs-bar">
        <div className="tabs-container">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  className="tab-underline"
                  layoutId="tab-underline"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <main className="channel-body-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabPanelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {activeTab === "home" && (
              <ChannelHomeTab
                channelId={channelId}
                isOwner={Boolean(channelData?.isOwner)}
              />
            )}
            {activeTab === "videos" && (
              <ChannelVideosTab
                channelId={channelId}
                isOwner={Boolean(channelData?.isOwner)}
              />
            )}
            {activeTab === "playlists" && (
              <ChannelPlaylistsTab channelId={channelId} />
            )}
            {activeTab === "about" && (
              <ChannelAboutTab channelData={channelData} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  )
}
