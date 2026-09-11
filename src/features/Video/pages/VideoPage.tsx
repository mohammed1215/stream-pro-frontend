import { createPortal } from "react-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CustomVideoPlayer } from "../components/VideoPlayer"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  fetchRelatedVideosApi,
  likeVideo,
  unLikeVideo,
  videoDetails,
  type VideoDetailResponse,
} from "../../../lib/video"
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Globe,
  ListVideo,
  Loader2,
  Lock,
  MoreHorizontal,
  MoreVertical,
  Share2,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react"
import { toast } from "react-toastify"
import { ChannelAvatar } from "../../../components/ChannelAvatar"
import { Button } from "../../../components/ui/button"
import { formatDurationInSeconds, formatNumber } from "../../../lib/helpers"
import {
  subscribeToChannel,
  unsubscribeToChannel,
} from "../../../lib/subscriptionApi"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useEffect, useRef, useState } from "react"
import { cn } from "../../../lib/utils"
import { Input } from "../../../components/ui/input"
import {
  getCommentsOfVideo,
  postCommentOnVideo,
  type CommentResponse,
} from "../../../lib/comment"
import { AxiosError } from "axios"
import { useAuth } from "../../Auth/hooks/useAuth"
import { PlaylistIcon } from "@vidstack/react/icons"
import { motion, AnimatePresence, type Variants } from "framer-motion"

import { CreatePlaylistModal } from "../../../components/CreatePlaylistModal"
import {
  DropdownWrapper,
  SaveDropdown,
} from "../../../components/features/SaveDropdown"
import {
  getPlaylistDetails,
  type PlaylistItemDto,
} from "../../../lib/playlists"
import { useCommentApi } from "../../../hooks/useComment"
import type { PaginatedType } from "../../../types/paginatedType"

dayjs.extend(relativeTime)

// 1️⃣ Type Definition للـ Related Video بناءً على الـ Response
export interface RelatedVideo {
  videoId: string
  title: string
  videoUrl: string | null
  hlsUrl: string | null
  thumbnailUrl: string
  channelId: string
  channelTitle: string
  channelImageUrl: string
  durationSeconds: number
  views: number
}

const pageContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const itemFadeVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  },
}

const commentItemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

function MoreOptionsDropdown({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <DropdownWrapper isOpen={isOpen} onClose={onClose}>
      <button
        type="button"
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
        onClick={() => {
          toast.info("Report feature coming soon.")
          onClose()
        }}
      >
        Report
      </button>
    </DropdownWrapper>
  )
}

const UserAvatar = ({
  user,
}: {
  user?: { name?: string; avatarUrl?: string | null } | null
}) =>
  user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name ? `${user.name} profile avatar` : "Profile avatar"}
      className="h-10 w-10 rounded-full object-cover shrink-0 border border-border"
    />
  ) : (
    <div className="w-10 h-10 bg-muted text-foreground rounded-full flex justify-center items-center font-bold shrink-0 border border-border">
      {user?.name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  )

function VideoPageSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <main className="mx-auto max-w-[1800px] p-4 lg:p-6 flex flex-col lg:flex-row gap-6 animate-pulse">
        <div className="flex-1 space-y-4">
          <div className="aspect-video w-full bg-muted rounded-xl" />
          <div className="h-8 w-3/4 bg-muted rounded-lg" />
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-muted rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
            <div className="h-10 w-32 bg-muted rounded-full" />
          </div>
          <div className="h-32 w-full bg-muted rounded-xl" />
        </div>
        <div className="w-full lg:w-[400px] space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-24 w-40 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function DescriptionBox({
  description,
  canExpand,
  openDescription,
  setOpenDescription,
  videoData,
}: {
  description: string
  canExpand: boolean
  openDescription: boolean
  setOpenDescription: React.Dispatch<React.SetStateAction<boolean>>
  videoData: VideoDetailResponse & { tags?: { id: string; name: string }[] }
}) {
  const navigate = useNavigate()
  const tags = videoData.tags ?? []

  return (
    <motion.div
      layout
      className={cn(
        "mt-4 rounded-xl bg-muted/50 p-4 transition-colors",
        canExpand && "cursor-pointer hover:bg-muted/70"
      )}
      onClick={() => canExpand && setOpenDescription((prev) => !prev)}
    >
      {/* Views & Timestamp */}
      <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
        <span>{formatNumber(videoData.views)} views</span>
        <span aria-hidden>•</span>
        <time dateTime={dayjs(videoData.createdAt).toISOString()}>
          {dayjs(videoData.createdAt).fromNow()}
        </time>
      </div>

      {/* Description Text */}
      <motion.div
        layout
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p
          className={cn(
            "text-sm whitespace-pre-line text-foreground/90 leading-relaxed",
            !openDescription && canExpand && "line-clamp-2"
          )}
        >
          {description || "No description provided."}
        </p>
      </motion.div>

      {(openDescription || !canExpand) && tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(tag.name)}`)
              }
              className="inline-flex items-center rounded-lg bg-background/80 hover:bg-background border border-border/60 px-2.5 py-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors shadow-xs"
            >
              #{tag.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* Show More / Less Button */}
      {canExpand && (
        <button
          type="button"
          aria-expanded={openDescription}
          onClick={(e) => {
            e.stopPropagation()
            setOpenDescription((prev) => !prev)
          }}
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-foreground transition-colors hover:text-primary"
        >
          {openDescription ? "Show less" : "Show more"}
          {openDescription ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </motion.div>
  )
}

export function CommentItem({ comment }: { comment: CommentResponse }) {
  const [commentSettings, setCommentSettings] = useState(false)
  const [commentInput, setCommentInput] = useState(comment.content)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  const dropDownRef = useRef<HTMLDivElement | null>(null)
  const editInputRef = useRef<HTMLInputElement | null>(null)

  const { updateComment, deleteComment } = useCommentApi()

  useEffect(() => {
    if (editMode) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editMode])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropDownRef.current &&
        !dropDownRef.current.contains(e.target as Node)
      ) {
        setCommentSettings(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleCancelEdit() {
    setCommentInput(comment.content)
    setError(null)
    setEditMode(false)
  }

  function handleEditSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    const trimmed = commentInput.trim()
    if (!trimmed) {
      setError("Comment cannot be empty")
      return
    }

    if (trimmed === comment.content) {
      setEditMode(false)
      return
    }

    updateComment(
      { commentId: comment.commentId, content: trimmed },
      {
        onSuccess: () => {
          setError(null)
          setEditMode(false)
        },
      }
    )
  }

  return (
    <motion.div
      variants={commentItemVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      layout
      className={cn(
        "relative flex gap-4 group p-2 rounded-xl transition-colors duration-200",
        editMode && "bg-muted/30 ring-1 ring-border/50"
      )}
    >
      <UserAvatar
        user={{ name: comment.userName, avatarUrl: comment.userProfileImage }}
      />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {comment.userName}
          </span>
          {comment.isEditted && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          <span className="text-xs text-muted-foreground">
            {dayjs(comment.createdAt).fromNow()}
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {editMode ? (
            <motion.form
              key="edit-form"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleEditSubmit}
              className="space-y-3 pt-1"
            >
              <div className="relative">
                <Input
                  ref={editInputRef}
                  type="text"
                  value={commentInput}
                  onChange={(e) => {
                    setCommentInput(e.target.value)
                    if (error) setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                  placeholder="Edit your comment..."
                  className="border-0 border-b-2 border-primary rounded-none px-0 bg-transparent text-sm text-foreground focus-visible:ring-0 focus-visible:border-primary transition-all h-9"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-destructive font-medium"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 px-3 text-xs font-semibold hover:bg-muted"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentInput.trim()}
                  className="rounded-full h-8 px-4 text-xs font-semibold gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="view-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line break-words">
                {comment.content}
              </p>

              <div className="flex items-center gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-1.5 h-8 px-3 hover:bg-muted"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs font-semibold">Like</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 px-3 text-xs font-semibold hover:bg-muted"
                >
                  Reply
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!editMode && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            setCommentSettings((prev) => !prev)
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      )}

      <AnimatePresence>
        {commentSettings && (
          <motion.div
            ref={dropDownRef}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.12 }}
            className="absolute right-2 top-8 z-20 w-40 rounded-xl border border-border bg-popover/95 backdrop-blur-sm p-1.5 shadow-xl"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium rounded-lg h-8"
              onClick={() => {
                setCommentSettings(false)
                setEditMode(true)
              }}
            >
              Edit Comment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8"
              onClick={() => {
                setCommentSettings(false)
                deleteComment({ commentId: comment.commentId })
              }}
            >
              Delete Comment
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ==========================================
// COMMENTS SECTION
// ==========================================

export const CommentsSection = ({
  commentsCount,
  onCommentSubmit,
  onCommentInput,
  commentInput,
  comments,
  pageNumber,
  setPageNumber,
  isLoadingComments,
  isSubmittingComment,
  onSortButtonClick,
}: {
  commentsCount: number
  onCommentSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCommentInput: (value: string) => void
  commentInput: string
  comments?: PaginatedType<CommentResponse>
  pageNumber: number
  setPageNumber: React.Dispatch<React.SetStateAction<number>>
  isLoadingComments: boolean
  isSubmittingComment: boolean
  onSortButtonClick?: () => void
}) => {
  const user = useAuth((state) => state.user)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div variants={itemFadeVariants} className="space-y-6 mt-8">
      {/* Header & Sort */}
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-bold">{commentsCount} Comments</h2>
        <Button
          variant="ghost"
          className="gap-2 rounded-full font-bold text-foreground"
          onClick={onSortButtonClick}
        >
          <ArrowUpDown className="h-4 w-4" /> Sort by
        </Button>
      </div>

      {/* Add Comment Form */}
      <div className="flex gap-4">
        <UserAvatar user={user} />
        <form onSubmit={onCommentSubmit} className="flex-1 space-y-3">
          <Input
            placeholder="Add a comment..."
            className="border-0 border-b rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 bg-transparent text-base h-10"
            value={commentInput}
            onChange={(e) => onCommentInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
          />

          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex justify-end gap-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full font-bold"
                  onClick={() => {
                    onCommentInput("")
                    setIsFocused(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full font-bold px-6"
                  disabled={!commentInput.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Comment"
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6 pt-4">
        {isLoadingComments ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments?.items.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {comments?.items.map((comment) => (
              <CommentItem key={comment.commentId} comment={comment} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination Controls */}
      {comments && comments.items.length > 0 && (
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber === 1 || isLoadingComments}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Page {pageNumber}{" "}
            {comments.totalPages ? `of ${comments.totalPages}` : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!comments.hasNextPage || isLoadingComments}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export const VideoPage = () => {
  const navigate = useNavigate()
  const user = useAuth((state) => state.user)
  const { videoId } = useParams()
  const queryClient = useQueryClient()

  const [params] = useSearchParams()
  const playlistId = params.get("list")

  const [openMoreVideoSettings, setOpenMoreVideoSettings] = useState(false)
  const [openPlaylistDropdown, setOpenPlaylistDropdown] = useState(false)
  const [openAddPlaylistModal, setOpenAddPlaylistModal] = useState(false)

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

  // 2️⃣ تم تحديث الـ queryKey ليتغير بتغير الـ videoId وجلب حالة التحميل isLoadingRelated
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
    enabled: !!playlistId,
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
          <motion.div
            variants={itemFadeVariants}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
          >
            <div className="flex items-center gap-3">
              <ChannelAvatar
                channelProfileImageUrl={videoData.channelImageUrl}
                channelName={videoData.channelTitle}
                channelId={videoData.channelId}
                size={12}
              />
              <div className="flex flex-col">
                <Link
                  to={`/channels/${videoData.channelId}`}
                  className="font-bold hover:opacity-80 transition"
                >
                  {videoData.channelTitle}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(videoData.channelSubscribersCount)} subscribers
                </span>
              </div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant={videoData.isSubscribed ? "secondary" : "default"}
                  size="lg"
                  className={cn(
                    "rounded-full font-bold px-6 ml-2 transition-all",
                    videoData.isSubscribed
                      ? "bg-muted hover:bg-muted/80"
                      : "bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black"
                  )}
                  onClick={() =>
                    videoData.isSubscribed
                      ? mutateUnSubscribe({ channelId: videoData.channelId })
                      : mutateSubscribe({ channelId: videoData.channelId })
                  }
                >
                  {videoData.isSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              </motion.div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Like Pill */}
              <div className="flex items-center bg-muted rounded-full overflow-hidden border border-border">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    className="rounded-none rounded-l-full gap-2 px-4 hover:bg-accent"
                    onClick={() =>
                      videoData.isLiked
                        ? mutateUnLikeVideo()
                        : mutateLikeVideo()
                    }
                  >
                    <ThumbsUp
                      className={cn(
                        "h-5 w-5 transition-transform",
                        videoData.isLiked &&
                          "fill-primary text-primary scale-110"
                      )}
                    />
                    <span className="font-bold">
                      {formatNumber(videoData.likesCount)}
                    </span>
                  </Button>
                </motion.div>
                <div className="w-px h-6 bg-border" />
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    className="rounded-none rounded-r-full px-3 hover:bg-accent"
                  >
                    <ThumbsDown className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="secondary"
                  className="rounded-full gap-2 px-4 font-bold"
                >
                  <Share2 className="h-5 w-5" /> Share
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="hidden sm:block"
              >
                <Button
                  variant="secondary"
                  className="rounded-full gap-2 px-4 font-bold"
                >
                  <Download className="h-5 w-5" /> Download
                </Button>
              </motion.div>

              {/* SAVE DROPDOWN */}
              {videoId && (
                <div className="relative hidden sm:block">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      variant="ghost"
                      className="rounded-full gap-2 px-4 font-bold"
                      onClick={() =>
                        user
                          ? setOpenPlaylistDropdown(!openPlaylistDropdown)
                          : toast.error("Login to save videos")
                      }
                      aria-expanded={openPlaylistDropdown}
                    >
                      <PlaylistIcon className="h-5 w-5" /> Save
                    </Button>
                  </motion.div>
                  <SaveDropdown
                    videoId={videoId}
                    isOpen={openPlaylistDropdown}
                    onClose={() => setOpenPlaylistDropdown(false)}
                  />
                </div>
              )}

              {/* MORE OPTIONS DROPDOWN */}
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() =>
                      setOpenMoreVideoSettings(!openMoreVideoSettings)
                    }
                    aria-expanded={openMoreVideoSettings}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </motion.div>
                <MoreOptionsDropdown
                  isOpen={openMoreVideoSettings}
                  onClose={() => setOpenMoreVideoSettings(false)}
                />
              </div>
            </div>
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
        <aside className="w-full lg:w-[400px] shrink-0 space-y-6">
          {/* Playlist Videos Section */}
          {playlistId && (
            <motion.div
              variants={itemFadeVariants}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
            >
              <div className="relative p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground line-clamp-2 mb-2">
                      {playlistDetails?.title || "Playlist Name"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {playlistDetails?.isPublic ? (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Private</span>
                          </>
                        )}
                      </div>
                      <span className="text-border">•</span>
                      <span>
                        {currentIndex} / {playlistDetails?.items?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {playlistDetails?.items?.map(
                  (video: PlaylistItemDto, index: number) => {
                    const isCurrentVideo = video.videoId === currentVideoId
                    return (
                      <motion.div
                        key={video.videoId}
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.15 }}
                        className={`group relative flex gap-3 p-3 cursor-pointer transition-colors duration-150 ${
                          isCurrentVideo
                            ? "bg-primary/10 border-l-4 border-l-primary"
                            : "hover:bg-accent/50 border-l-4 border-l-transparent"
                        }`}
                        onClick={() => {
                          navigate(
                            `/videos/${video.videoId}?list=${playlistId}`
                          )
                        }}
                      >
                        <div className="flex items-center justify-center w-6 shrink-0 text-xs font-medium text-muted-foreground select-none">
                          {isCurrentVideo ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>

                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              No Thumbnail
                            </div>
                          )}

                          {video.durationSeconds && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                              {formatDurationInSeconds(video.durationSeconds)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <h3
                            className={`font-medium text-sm line-clamp-2 leading-tight transition-colors ${
                              isCurrentVideo
                                ? "text-primary font-semibold"
                                : "text-foreground group-hover:text-primary"
                            }`}
                          >
                            {video.title}
                          </h3>
                          {video.channelTitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {video.channelTitle}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )
                  }
                )}
              </div>
            </motion.div>
          )}

          {/* 3️⃣ Up Next / Related Videos Section الفعلي */}
          <motion.div
            variants={itemFadeVariants}
            className="bg-card border border-border rounded-xl p-4 shadow-sm"
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ListVideo className="w-5 h-5 text-primary" />
              Up Next
            </h2>

            <div className="space-y-3">
              {isLoadingRelated ? (
                /* Skeleton Loading State */
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-1">
                    <div className="w-36 aspect-video bg-muted rounded-lg shrink-0 animate-pulse" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 w-full bg-muted rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-2.5 w-1/2 bg-muted/60 rounded animate-pulse mt-2" />
                    </div>
                  </div>
                ))
              ) : relatedVideos && relatedVideos.length > 0 ? (
                /* قائمة الفيديوهات المقترحة */
                relatedVideos.map((video) => (
                  <motion.div
                    key={video.videoId}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => navigate(`/videos/${video.videoId}`)}
                    className="group flex gap-3 p-1.5 rounded-lg hover:bg-accent/60 cursor-pointer transition-colors duration-150"
                  >
                    {/* Thumbnail + Duration */}
                    <div className="relative w-36 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Thumbnail
                        </div>
                      )}

                      {typeof video.durationSeconds === "number" && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                          {formatDurationInSeconds(video.durationSeconds)}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-start">
                      <h3
                        className="font-medium text-sm line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors"
                        title={video.title}
                      >
                        {video.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {video.channelTitle}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <span>{formatNumber(video.views)} views</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No related videos found
                </div>
              )}
            </div>
          </motion.div>
        </aside>
      </main>

      {createPortal(
        <CreatePlaylistModal
          open={openAddPlaylistModal}
          onClose={() => setOpenAddPlaylistModal(false)}
        />,
        document.body
      )}
    </motion.div>
  )
}
