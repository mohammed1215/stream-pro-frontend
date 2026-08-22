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
import {
  Bell,
  Check,
  ListVideo,
  Play,
  Share,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react"
import {
  subscribeToChannel,
  unsubscribeToChannel,
} from "../lib/subscriptionApi"
import dayjs from "dayjs"

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
      if (!channelId)
        return toast.error("Channel ID is missing", { position: "top-center" })
      return isSubscribed
        ? unsubscribeToChannel(channelId)
        : subscribeToChannel(channelId)
    },
    onMutate: async (isSubscribed: boolean) => {
      await queryClient.cancelQueries({ queryKey: ["channels", channelId] })

      const previousChannelData = queryClient.getQueryData([
        "channels",
        channelId,
      ])

      queryClient.setQueryData(["channels", channelId], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          isSubscribed: !isSubscribed,
          subscriptionsCount: isSubscribed
            ? oldData.subscriptionsCount - 1
            : oldData.subscriptionsCount + 1,
        }
      })
      return { previousChannelData }
    },
    onError: (err, isSubscribed, context) => {
      if (context?.previousChannelData) {
        queryClient.setQueryData(
          ["channels", channelId],
          context.previousChannelData
        )
      }
      toast.error("Something went wrong", { position: "top-center" })
    },
    onSuccess: (data, isSubscribed: boolean) => {
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
    <div className="channel-buttons">
      {!isOwner ? (
        <>
          <button
            disabled={isPending}
            className={isSubscribed ? "subscribed-button" : "subscribe-button"}
            onClick={() => toggleSubscribe(isSubscribed)}
          >
            {isSubscribed ? (
              <>
                Subscribed <Check size={18} />
              </>
            ) : (
              <>
                Subscribe <Bell size={18} />
              </>
            )}
          </button>
          <button
            className="share-button"
            disabled={!url}
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
            Share <Share size={18} />
          </button>
        </>
      ) : (
        <>
          <button
            className="customize-button"
            onClick={() =>
              navigate(`/studio/channel/${channelId}/customization`)
            }
          >
            <SlidersHorizontal size={18} />
            Customize Channel
          </button>
          <button
            className="manage-button"
            onClick={() => navigate(`/studio/channel/${channelId}/videos`)}
          >
            <Video size={18} />
            Manage Videos
          </button>
        </>
      )}
    </div>
  )
}
type VideoType = FetchChannelVideosResponse["items"][0]
type PlaylistType = FetchChannelPlaylistsResponse["items"][0]

const ChannelVideoItem = ({ video }: { video: VideoType }) => {
  const navigate = useNavigate()
  return (
    <div
      key={video.videoId}
      className="channel-video-item channel-item"
      onClick={() => navigate(`/videos/${video.videoId}`)}
    >
      <div className="channel-video-thumbnail-container">
        <img
          className="channel-video-thumbnail"
          src={video.thumbnailUrl}
          alt={video.videoTitle}
        />
        <div className="channel-video-play-icon-container">
          <Play size={24} className="channel-video-play-icon" />
        </div>
        <div className="channel-video-backdrop" />
      </div>
      {/* video info */}
      <div className="channel-video-info">
        <h2 className="channel-video-title">{video.videoTitle}</h2>
        <div className="channel-video-stats">
          <span className={"channel-video-stat"}>
            {formatNumber(video.views)} views
          </span>
          •
          <span className={"channel-video-stat"}>
            {dayjs(video.createdAt).fromNow()}
          </span>
        </div>
      </div>
    </div>
  )
}

const ChannelHomeTab = ({ channelId }: { channelId?: string }) => {
  const { data: homeData, isPending: isHomePending } = useQuery({
    queryKey: ["channels", channelId, "home"],
    queryFn: ({ signal }) => {
      if (!channelId) {
        toast.error("Channel ID is missing", { position: "top-center" })
        throw new Error("Channel ID is missing")
      }
      return fetchChannelHome(channelId, signal)
    },
  })

  if (isHomePending) {
    ;<div>Loading Home Data</div>
  }

  return (
    <div className="channel-home mt-2">
      {homeData ? (
        <>
          {/* Latest Videos */}
          <div className="mb-8">
            <h2 className="flex gap-2 font-bold">
              <Play fill="currentColor" className="text-accent" />
              Latest Videos
            </h2>
            <div className="channel-videos-list channel-list">
              {homeData.videos.length > 0 ? (
                <>
                  {homeData.videos.map((video) => (
                    <ChannelVideoItem key={video.videoId} video={video} />
                  ))}
                </>
              ) : (
                <div>No videos available.</div>
              )}
            </div>
          </div>

          {/*  Playlists */}
          <div className="mb-8">
            <h2 className="flex gap-2 font-bold">
              <ListVideo
                fill="currentColor"
                className="channel-playlist-thumbnail-icon text-accent"
              />
              Playlists
            </h2>
            <div className="channel-playlists-list channel-list">
              {homeData.playlists.length > 0 ? (
                <>
                  {homeData.playlists.map((playlist) => (
                    <ChannelPlaylistItem
                      key={playlist.id}
                      playlist={playlist}
                    />
                  ))}
                </>
              ) : (
                <div>No playlists available.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div></div>
      )}
    </div>
  )
}
const ChannelVideosTab = ({ channelId }: { channelId?: string }) => {
  const scrollDom = useRef<HTMLDivElement>(null)
  const {
    data: channelVideos,
    isPending: isVideosPending,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["channels", channelId, "videos"],
    queryFn: ({ pageParam, signal }) => {
      if (!channelId) {
        toast.error("Channel ID is missing", { position: "top-center" })
        throw new Error("Channel ID is missing")
      }
      return fetchChannelVideos(
        channelId,
        { pageNumber: pageParam, pageSize: 10 },
        signal
      )
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined
    },
    initialPageParam: 1,
  })

  useEffect(() => {
    const dom = scrollDom.current
    if (!dom) return

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement
      if (
        target.scrollHeight - target.scrollTop <= target.clientHeight + 1 &&
        hasNextPage
      ) {
        fetchNextPage()
      }
    }

    dom.addEventListener("scroll", handleScroll)
    return () => dom.removeEventListener("scroll", handleScroll)
  }, [fetchNextPage, hasNextPage])

  return (
    <div className="channel-videos" ref={scrollDom}>
      {isVideosPending ? (
        <div>Loading videos...</div>
      ) : channelVideos && channelVideos.pages[0].items.length > 0 ? (
        <div className="channel-videos-list channel-list">
          {channelVideos.pages.map((page, index) => (
            <Fragment key={index}>
              {page.items.map((video) => (
                <ChannelVideoItem key={video.videoId} video={video} />
              ))}
            </Fragment>
          ))}
        </div>
      ) : (
        <div>No videos available.</div>
      )}
    </div>
  )
}

const ChannelPlaylistItem = ({ playlist }: { playlist: PlaylistType }) => {
  const navigate = useNavigate()
  return (
    <div
      className="channel-playlist-item channel-item"
      onClick={() => navigate(`/playlists/${playlist.id}`)}
    >
      <div className="channel-playlist-thumbnail-container">
        <div className="channel-playlist-thumbnail">
          <div className="channel-playlist-thumbnail-icon-container">
            <ListVideo className="channel-playlist-thumbnail-icon border-border" />
          </div>
          <span className="channel-playlist-videos-count">
            {playlist.videosCount} videos
          </span>
        </div>
        <div className="channel-playlist-backdrop" />
      </div>
      <div className="channel-playlist-info">
        <h3 className="channel-playlist-title">{playlist.title}</h3>
        <p className="channel-playlist-description">{playlist.description}</p>
        <div className="channel-playlist-stats">
          <span className={"channel-playlist-stat"}>
            {dayjs(playlist.createdAt).fromNow()}
          </span>
        </div>
      </div>
    </div>
  )
}

const ChannelPlaylistsTab = ({ channelId }: { channelId?: string }) => {
  const { data: channelPlaylists, isPending: isPlaylistsPending } =
    useInfiniteQuery({
      queryKey: ["channels", channelId, "playlists"],
      queryFn: ({ pageParam, signal }) => {
        if (!channelId) {
          toast.error("Channel ID is missing", { position: "top-center" })
          throw new Error("Channel ID is missing")
        }
        return fetchChannelPlaylists(
          channelId,
          { pageNumber: pageParam, pageSize: 10 },
          signal
        )
      },
      getNextPageParam: (lastPage) => {
        return lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined
      },
      initialPageParam: 1,
    })
  return (
    <div>
      {isPlaylistsPending ? (
        <div>Loading playlists...</div>
      ) : channelPlaylists ? (
        <div className="channel-playlists-list channel-list">
          {channelPlaylists.pages.map((page, index) => (
            <Fragment key={index}>
              {page.items.map((playlist) => (
                <ChannelPlaylistItem key={playlist.id} playlist={playlist} />
              ))}
            </Fragment>
          ))}
        </div>
      ) : (
        <div>No playlists available.</div>
      )}
    </div>
  )
}
const ChannelAboutTab = ({ channelId }: { channelId?: string }) => {
  return <div>About Tab Content</div>
}

const TABS = ["home", "videos", "playlists", "about"] as const

export const ChannelDetailsPage = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const [openDescription, setOpenDescription] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const {
    data: channelData,
    isPending,
    error,
  } = useQuery({
    queryKey: ["channels", channelId],
    queryFn: ({ signal }) => {
      if (!channelId) {
        toast.error("Channel ID is missing", { position: "top-center" })
        throw new Error("Channel ID is missing")
      }
      return fetchChannelData(channelId, signal)
    },
  })

  if (isPending) {
    return <div>Loading...</div>
  }

  if (!channelData) {
    return <div>Channel data not found</div>
  }

  const characterLimit = 50
  const characters = channelData.description.length
  const shouldTruncate = characters > characterLimit && !openDescription
  const truncatedDescription = shouldTruncate
    ? channelData.description.slice(0, characterLimit) + "..."
    : channelData.description

  return (
    <div className="channel-details">
      {/* thumbnail */}
      <div className="relative mb-16">
        <img
          src={channelData?.thumbnailUrl}
          alt={channelData?.title}
          className="channel-thumbnail"
        />
        <img
          src={channelData?.channelImageUrl}
          alt={channelData?.title}
          className="channel-avatar"
        />
      </div>
      {/* channel info */}
      <div className="channel-info">
        <h1 className="channel-title">{channelData?.title}</h1>
        <p
          className={`channel-description ${
            openDescription ? "" : "line-clamp-1"
          } `}
        >
          {truncatedDescription}
          {openDescription ? (
            <span
              className="text-blue-500 cursor-pointer font-bold select-none"
              onClick={() => setOpenDescription(false)}
            >
              Show less
            </span>
          ) : (
            <span
              className="text-blue-500 cursor-pointer font-bold select-none"
              onClick={() => setOpenDescription(true)}
            >
              Show more
            </span>
          )}
        </p>
        <div className="channel-stats-container">
          <span className="channel-stats">
            <span className="channel-stats-value">
              {channelData.subscriptionsCount}
            </span>{" "}
            subscribers
          </span>
          •
          <span className="channel-stats">
            <span className="channel-stats-value">
              {channelData.videosCount}
            </span>{" "}
            videos
          </span>
          •
          <span className="channel-stats">
            <span className="channel-stats-value">
              {formatNumber(channelData.totalViews)}
            </span>{" "}
            total views
          </span>
        </div>
        {/* Buttons */}
        <ChannelButtons
          isSubscribed={channelData.isSubscribed}
          isOwner={channelData.isOwner}
          channelId={channelId}
        />
      </div>

      {/* Tabs */}
      <div className="channel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`channel-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* channel videos */}
      <div className="channel-videos">
        {activeTab === "home" && <ChannelHomeTab channelId={channelId} />}
        {activeTab === "videos" && <ChannelVideosTab channelId={channelId} />}
        {activeTab === "playlists" && (
          <ChannelPlaylistsTab channelId={channelId} />
        )}
        {activeTab === "about" && <ChannelAboutTab channelId={channelId} />}
      </div>
    </div>
  )
}
