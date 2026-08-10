import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CustomVideoPlayer } from "../components/VideoPlayer"
import { useParams } from "react-router-dom"
import { likeVideo, unLikeVideo, videoDetails } from "../../../lib/video"
import {
  ChevronDown,
  EllipsisVertical,
  Loader,
  Share2,
  ThumbsUp,
} from "lucide-react"
import { toast } from "react-toastify"
import { ChannelAvatar } from "../../../components/ChannelAvatar"
import { Button } from "../../../components/ui/button"
import { formatDuration, formatNumber } from "../../../lib/helpers"
import {
  subscribeToChannel,
  unsubscribeToChannel,
} from "../../../lib/subscriptionApi"
import { formatTime } from "@vidstack/react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"
import { cn } from "../../../lib/utils"
import { Input } from "../../../components/ui/input"
import {
  getCommentsOfVideo,
  postCommentOnVideo,
  type CommentResponse,
} from "../../../lib/comment"
import { AxiosError } from "axios"
import { useAuth } from "../../Auth/hooks/useAuth"
import type { PaginatedType } from "../../../types/paginatedType"
dayjs.extend(relativeTime)
export const VideoPage = () => {
  const { user } = useAuth()
  const { videoId } = useParams()
  const queryClient = useQueryClient()

  const [openDescription, setOpenDescription] = useState(false)
  const [commentInput, setCommentInput] = useState("")

  const [pageNumber, setPageNumber] = useState(1)
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

  const { data: comments } = useQuery({
    queryKey: ["get-comments", videoId, pageNumber],
    queryFn: () => {
      if (!videoId) {
        toast.error("video id is required")
        return
      }
      return getCommentsOfVideo(videoId, pageNumber, pageSize)
    },
  })

  const { mutate: mutateSubscribe } = useMutation({
    mutationFn: async (data: { channelId: string }) => {
      return subscribeToChannel(data.channelId)
    },
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
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error("Failed to subscribe")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const { mutate: mutateUnSubscribe } = useMutation({
    mutationFn: async (data: { channelId: string }) => {
      return unsubscribeToChannel(data.channelId)
    },
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
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error("Failed to unsubscribe")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const { mutate: submitComment } = useMutation({
    mutationFn: async (data: { content: string }) => {
      if (!videoId) {
        toast.error("video id is required")
        return
      }
      return postCommentOnVideo(videoId, data.content)
    },
    onSuccess() {
      setCommentInput("")
    },
    onError(error) {
      if (error instanceof AxiosError) {
        if (error.status === 409) {
          toast.error("you already commented on this video")
        }
      }
    },
  })

  const { mutate: mutateLikeVideo } = useMutation({
    mutationFn: async () => {
      if (!videoId) {
        toast.error("video id is required")
        return
      }
      return likeVideo(videoId)
    },
  })

  const { mutate: mutateUnLikeVideo } = useMutation({
    mutationFn: async () => {
      if (!videoId) {
        toast.error("video id is required")
        return
      }
      return unLikeVideo(videoId)
    },
  })

  function handleAddComment(e: React.SubmitEvent) {
    e.preventDefault()
    submitComment({ content: commentInput })
  }

  function handleUnLikeVideo() {
    mutateUnLikeVideo()
  }

  function handleLikeVideo() {
    mutateLikeVideo()
  }

  if (isPending) {
    return (
      <div>
        <Loader /> skeleton
      </div>
    )
  }

  if (!videoData) {
    return <div>Something went wrong</div>
  }

  const description = videoData.description?.trim() ?? ""
  const canExpand = description.length > 140

  return (
    <div className="h-screen w-full relative">
      <main className="p-4 py-0 h-full flex">
        {/* Left Video Details */}
        <div className="flex-8/12 p-4">
          {/* Video Player */}
          <CustomVideoPlayer title={videoData.title} src={videoData.videoUrl} />
          {/* Channel info and video info*/}
          <div className="text-xl font-bold my-2">{videoData.title}</div>

          <div className="flex justify-between items-center">
            <div className="flex gap-1 items-center">
              <ChannelAvatar
                channelProfileImageUrl={videoData.channelImageUrl}
                channelName={videoData.channelTitle}
                channelId={videoData.channelId}
                size={12}
              />
              <div className="flex flex-col gap-1">
                <span className="text-foreground text-lg font-bold">
                  {videoData.channelTitle}
                </span>
                <span>
                  {formatNumber(videoData.channelSubscribersCount) + " "}
                  subscribers
                </span>
              </div>
              <Button
                className={`text-white w-30 h-10 rounded-full ${
                  videoData.isSubscribed
                    ? "bg-gray-500 border border-white"
                    : "bg-red-500 hover:bg-red-600 "
                }`}
                onClick={() => {
                  if (!videoData.isSubscribed) {
                    mutateSubscribe({
                      channelId: videoData.channelId,
                    })
                  } else {
                    mutateUnSubscribe({ channelId: videoData.channelId })
                  }
                }}
              >
                {videoData.isSubscribed ? "UnSubscribe" : "Subscribe"}
              </Button>
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant={"ghost"}
                onClick={() => {
                  if (videoData.isLiked) {
                    handleUnLikeVideo()
                  } else {
                    handleLikeVideo()
                  }
                }}
              >
                <ThumbsUp
                  fill={videoData.isLiked ? "currentColor" : "none"}
                  size={15}
                />
                {formatNumber(videoData.likesCount)}
              </Button>
              <Button variant={"ghost"} onClick={() => {}}>
                <Share2 /> Share
              </Button>
            </div>
          </div>

          {/* Views + Description */}
          <div className="mt-2 rounded-lg border p-3 shadow-lg transition-colors hover:bg-black/20">
            {/* Views + date */}
            <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-foreground/80">
              <span>{formatNumber(videoData.views)} views</span>
              <span aria-hidden>•</span>
              <time dateTime={dayjs(videoData.createdAt).toISOString()}>
                {dayjs(videoData.createdAt).fromNow()}
              </time>
            </div>

            {/* Description */}
            <p
              className={cn(
                "mt-2 whitespace-pre-line text-sm text-foreground/90",
                !openDescription && canExpand && "line-clamp-2"
              )}
            >
              {description || "No description provided."}
            </p>

            {/* Toggle button */}
            {canExpand && (
              <button
                type="button"
                aria-expanded={openDescription}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenDescription((prev) => !prev)
                }}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                {openDescription ? "Show less" : "Read more"}

                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    openDescription && "rotate-180"
                  )}
                />
              </button>
            )}
          </div>

          {/* Comments */}
          <CommentsSection
            commentInput={commentInput}
            onCommentInput={setCommentInput}
            onCommentSubmit={handleAddComment}
            comments={comments}
            commentsCount={videoData.commentsCount}
          />
        </div>

        {/* Video Recommendations */}
        <div className="border-l-2 border-l-border flex-4/12 p-3">videos</div>
      </main>
    </div>
  )
}

export const CommentsSection = ({
  commentsCount,
  onCommentSubmit,
  onCommentInput,
  commentInput,
  comments,
}: {
  commentsCount: number
  onCommentSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void
  onCommentInput: (value: string) => void
  commentInput: string
  comments?: PaginatedType<CommentResponse>
}) => {
  const { user } = useAuth()
  return (
    <div>
      <p>{commentsCount} Comments</p>
      <div className="flex items-center gap-2 my-2">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name ? `${user.name} profile avatar` : "Profile avatar"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-secondary text-white rounded-full justify-center items-center flex font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        <form onSubmit={onCommentSubmit} className="flex-1">
          <Input
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => onCommentInput(e.target.value)}
          />
        </form>
      </div>
      <div className={"flex flex-col gap-2 my-4 py-5"}>
        {comments?.items.length === 0 && (
          <div className="text-center text-sm text-foreground/70">
            No comments yet. Be the first to comment!
          </div>
        )}
        {comments?.items.map((comment) => {
          return (
            <div key={comment.commentId} className="flex justify-between py-2">
              <div className="flex gap-2 items-start">
                {/* image of user comment */}
                <div>
                  {comment.userProfileImage ? (
                    <img
                      src={comment.userProfileImage}
                      alt={
                        comment.userName
                          ? `${comment.userName} profile avatar`
                          : "Profile avatar"
                      }
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary text-white rounded-full justify-center items-center flex font-bold">
                      {comment.userName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                {/* comment content */}
                <div className="ml-2">
                  <p className="text-sm font-medium text-foreground/90 flex items-center gap-2">
                    {comment.userName}
                    <span className="text-xs text-foreground/50 ml-2">
                      {dayjs(comment.createdAt).fromNow()}
                    </span>
                  </p>
                  <p className="text-sm text-foreground/70">
                    {comment.content}
                  </p>
                </div>
              </div>
              <div className={""}>
                <Button variant={"ghost"} size={"sm"}>
                  <EllipsisVertical />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
