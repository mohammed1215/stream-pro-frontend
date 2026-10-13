import { createPortal } from "react-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CustomVideoPlayer } from "../components/VideoPlayer"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  fetchRelatedVideosApi,
  likeVideo,
  unLikeVideo,
  videoDetails,
} from "../../../lib/video"
import { toast } from "react-toastify"
import {
  subscribeToChannel,
  unsubscribeToChannel,
} from "../../../lib/subscriptionApi"
import { useState } from "react"
import { getCommentsOfVideo, postCommentOnVideo } from "../../../lib/comment"
import { AxiosError } from "axios"
import { motion } from "framer-motion"

import { CreatePlaylistModal } from "../../../components/CreatePlaylistModal"
import { getPlaylistDetails, type PlaylistItemDto } from "../../../lib/playlists"
import { getWatchLater } from "../../../lib/watchlater"
import { getLikedVideos } from "../../../lib/likes"
import { DescriptionBox } from "../components/DescriptionBox"
import { CommentsSection } from "../components/CommentsSection"
import { VideoActionBar } from "../components/VideoActionBar"
import { PlaylistSidebar } from "../components/PlaylistSidebar"
import { RelatedVideos } from "../components/RelatedVideos"
import { VideoPageSkeleton } from "../components/VideoPageSkeleton"
import type { RelatedVideo } from "../components/videoTypes"
import {
  itemFadeVariants,
  pageContainerVariants,
} from "../components/videoPageVariants"

export const VideoPage = () => {
  const navigate = useNavigate()
  const { videoId } = useParams()
  const queryClient = useQueryClient()

  const [params] = useSearchParams()
  const playlistId = params.get("list")

  const [openMoreVideoSettings, setOpenMoreVideoSettings] = useState(false)

  const [openDescription, setOpenDescription] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [pageNumber, setPageNumber] = useState(1)
  const [sort, setSort] = useState<"asc" | "desc">("asc")
  const pageSize = 10
  const queryKey = ["video-details", videoId]

  const {
    data: videoData,
    isPending,
    isError,
  } = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      if (!videoId) {
        toast.error("No Video Id Was Provided")
        return
      }
      return videoDetails(videoId)
    },
  })

  const { data: comments, isPending: isLoadingComments } = useQuery({
    queryKey: ["comments", videoId, pageNumber, sort],
    queryFn: () => {
      if (!videoId) {
        toast.error("video id is required")
        return
      }
      return getCommentsOfVideo(videoId, pageNumber, pageSize, sort)
    },
  })

  const { mutate: mutateSubscribe } = useMutation({
    mutationFn: async (data: { channelId: string }) =>
      subscribeToChannel(data.channelId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: typeof videoData) => {
        if (!old) return old
        return {
          ...old,
          isSubscribed: true,
          channelSubscribersCount: old.channelSubscribersCount + 1,
        }
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData)
        queryClient.setQueryData(queryKey, context.previousData)
      toast.error("Failed to subscribe")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const { mutate: mutateUnSubscribe } = useMutation({
    mutationFn: async (data: { channelId: string }) =>
      unsubscribeToChannel(data.channelId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: typeof videoData) => {
        if (!old) return old
        return {
          ...old,
          isSubscribed: false,
          channelSubscribersCount: Math.max(0, old.channelSubscribersCount - 1),
        }
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData)
        queryClient.setQueryData(queryKey, context.previousData)
      toast.error("Failed to unsubscribe")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const { mutate: submitComment, isPending: isSubmittingComment } = useMutation(
    {
      mutationFn: async (data: { content: string }) => {
        if (!videoId) {
          toast.error("video id is required")
          return
        }
        return postCommentOnVideo({ videoId, content: data.content })
      },
      onSuccess() {
        setCommentInput("")
        queryClient.invalidateQueries({ queryKey: ["comments", videoId] })
      },
      onError(error) {
        if (error instanceof AxiosError && error.status === 409) {
          toast.error("you already commented on this video")
        }
      },
    }
  )

  const { data: relatedVideos, isPending: isLoadingRelated } = useQuery<
    RelatedVideo[]
  >({
    queryKey: ["related", "videos", videoId],
    queryFn: async () => {
      if (!videoId) return []
      const videos = await fetchRelatedVideosApi(videoId)
      return videos
    },
    enabled: !!videoId,
  })

  const { mutate: mutateLikeVideo } = useMutation({
    mutationFn: async () => {
      if (!videoId) return
      return likeVideo(videoId)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const { mutate: mutateUnLikeVideo } = useMutation({
    mutationFn: async () => {
      if (!videoId) return
      return unLikeVideo(videoId)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const { data: playlistDetails } = useQuery({
    queryKey: ["playlist-details", playlistId],
    queryFn: () => {
      if (!playlistId) return undefined
      return getPlaylistDetails(playlistId, {})
    },
    enabled: !!playlistId && !["WLP", "LVP"].includes(playlistId),
  })

  const { data: watchLaterDetails } = useQuery({
    queryKey: ["watchLater", playlistId],
    queryFn: () => {
      if (!playlistId) return undefined
      return getWatchLater()
    },
    enabled: !!playlistId && playlistId === "WLP",
  })

  const { data: likedVideosDetails } = useQuery({
    queryKey: ["liked-videos", playlistId],
    queryFn: () => {
      if (!playlistId) return undefined
      return getLikedVideos()
    },
    enabled: !!playlistId && playlistId === "LVP",
  })

  function handleAddComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (commentInput.trim()) submitComment({ content: commentInput })
  }

  const currentIndex =
    (playlistDetails?.items?.findIndex(
      (v: PlaylistItemDto) => v.videoId === videoId
    ) ?? -1) + 1
  const currentVideoId = videoId

  if (isPending) return <VideoPageSkeleton />
  if (!videoData || isError)
    return (
      <div className="p-10 text-center text-destructive font-medium">
        Failed to load video.
      </div>
    )

  const description = videoData.description?.trim() ?? ""
  const canExpand = description.length > 140

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen w-full bg-background text-foreground"
    >
      <main className="mx-auto max-w-[1800px] p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-4 max-w-full">
          {/* Player Container */}
          <motion.div
            variants={itemFadeVariants}
            className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/50"
          >
            <CustomVideoPlayer
              title={videoData.title}
              src={videoData.hlsUrl ?? ""}
              videoId={videoData.videoId}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemFadeVariants}
            className="text-xl lg:text-2xl font-bold leading-tight tracking-tight"
          >
            {videoData.title}
          </motion.h1>

          {/* Meta & Actions Bar */}
          <motion.div variants={itemFadeVariants}>
            <VideoActionBar
              videoData={videoData}
              videoId={videoId}
              openMoreVideoSettings={openMoreVideoSettings}
              onToggleMore={() =>
                setOpenMoreVideoSettings(!openMoreVideoSettings)
              }
              onCloseMore={() => setOpenMoreVideoSettings(false)}
              onSubscribe={(channelId) => mutateSubscribe({ channelId })}
              onUnsubscribe={(channelId) => mutateUnSubscribe({ channelId })}
              onLike={() => mutateLikeVideo()}
              onUnlike={() => mutateUnLikeVideo()}
            />
          </motion.div>

          <DescriptionBox
            description={description}
            canExpand={canExpand}
            openDescription={openDescription}
            setOpenDescription={setOpenDescription}
            videoData={videoData}
          />

          <CommentsSection
            commentInput={commentInput}
            onCommentInput={setCommentInput}
            onCommentSubmit={handleAddComment}
            comments={comments}
            commentsCount={videoData.commentsCount}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            isLoadingComments={isLoadingComments}
            isSubmittingComment={isSubmittingComment}
            onSortButtonClick={() =>
              setSort((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          />
        </div>

        {/* RIGHT COLUMN */}
        <aside className="w-full lg:w-100 shrink-0 space-y-6">
          <PlaylistSidebar
            playlistId={playlistId}
            playlistDetails={playlistDetails}
            watchLaterDetails={watchLaterDetails}
            likedVideosDetails={likedVideosDetails}
            currentIndex={currentIndex}
            currentVideoId={currentVideoId}
            onNavigate={(id) => navigate(`/videos/${id}?list=${playlistId}`)}
          />
          <motion.div variants={itemFadeVariants}>
            <RelatedVideos
              relatedVideos={relatedVideos}
              isLoadingRelated={isLoadingRelated}
              onSelect={(id) => navigate(`/videos/${id}`)}
            />
          </motion.div>
        </aside>
      </main>

      {createPortal(<CreatePlaylistModal />, document.body)}
    </motion.div>
  )
}
