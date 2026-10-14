import { useEffect, useRef, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  MoreVertical,
  ThumbsUp,
  X,
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { getRepliesOfComment, type CommentResponse } from "../../../lib/comment"
import { useCommentApi } from "../../../hooks/useComment"
import dayjs from "../../../lib/dayjs"
import { cn } from "../../../lib/utils"
import { commentItemVariants } from "./videoPageVariants"
import { useAuth } from "../../Auth/hooks/useAuth"

export const UserAvatar = ({
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

export function CommentItem({ comment }: { comment: CommentResponse }) {
  const user = useAuth((state) => state.user)

  const [commentSettings, setCommentSettings] = useState(false)
  const [commentInput, setCommentInput] = useState(comment.content)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  const [replyMode, setReplyMode] = useState(false)
  const [replyInput, setReplyInput] = useState("")
  const [replyError, setReplyError] = useState<string | null>(null)
  const replyInputRef = useRef<HTMLInputElement | null>(null)

  const [showReplies, setShowReplies] = useState(false)

  const dropDownRef = useRef<HTMLDivElement | null>(null)
  const editInputRef = useRef<HTMLInputElement | null>(null)

  const { updateComment, deleteComment, postComment, isPostingComment } =
    useCommentApi()
  const REPLIES_PAGE_SIZE = 10
  const {
    data: repliesPages,
    isLoading: isRepliesLoading,
    isFetchingNextPage: isFetchingMoreReplies,
    hasNextPage: hasMoreReplies,
    fetchNextPage: fetchMoreReplies,
    isError: isRepliesError,
  } = useInfiniteQuery({
    queryKey: ["replies", comment.commentId],
    queryFn: ({ pageParam = 1 }) =>
      getRepliesOfComment(comment.commentId, pageParam, REPLIES_PAGE_SIZE),
    enabled: showReplies,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === REPLIES_PAGE_SIZE ? allPages.length + 1 : undefined,
  })
  const replies = repliesPages?.pages.flat() ?? []

  useEffect(() => {
    if (editMode) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editMode])

  useEffect(() => {
    if (replyMode) {
      replyInputRef.current?.focus()
    }
  }, [replyMode])

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

  function handleCancelReply() {
    setReplyInput("")
    setReplyError(null)
    setReplyMode(false)
  }

  function handleReplySubmit(e?: React.FormEvent) {
    e?.preventDefault()

    const trimmed = replyInput.trim()
    if (!trimmed) {
      setReplyError("Reply cannot be empty")
      return
    }

    postComment(
      {
        content: trimmed,
        videoId: comment.videoId,
        parentId: comment.commentId,
      },
      {
        onSuccess: () => {
          setReplyInput("")
          setReplyError(null)
          setReplyMode(false)
          // Keep the list open so the newly posted reply is visible,
          // even when replyCount was 0 (first reply). The ["replies"]
          // invalidation in useCommentApi refetches the list.
          setShowReplies(true)
        },
        onError: () => {
          setReplyError("Failed to post reply. Please try again.")
        },
      }
    )
  }

  function handleShowReplies() {
    setShowReplies((prev) => !prev)
  }

  // The server replyCount is stale until ["comments"] refetches, so fall back
  // to the fetched replies length. This keeps the toggle + list visible for
  // the first reply (replyCount === 0) right after posting.
  const fetchedRepliesCount = replies.length
  const displayReplyCount = Math.max(comment.replyCount, fetchedRepliesCount)
  const hasReplies = displayReplyCount > 0 || showReplies

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
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line wrap-break-word">
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
                  onClick={() => setReplyMode((prev) => !prev)}
                >
                  Reply
                </Button>
              </div>

              <AnimatePresence initial={false}>
                {replyMode && (
                  <motion.form
                    key="reply-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleReplySubmit}
                    className="space-y-2 pt-2 overflow-hidden"
                  >
                    <Input
                      ref={replyInputRef}
                      type="text"
                      value={replyInput}
                      onChange={(e) => {
                        setReplyInput(e.target.value)
                        if (replyError) setReplyError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") handleCancelReply()
                      }}
                      placeholder={`Reply to ${comment.userName}...`}
                      className="border-0 border-b-2 border-primary rounded-none px-0 bg-transparent text-sm text-foreground focus-visible:ring-0 focus-visible:border-primary transition-all h-9"
                    />

                    {replyError && (
                      <p className="text-xs text-destructive font-medium">
                        {replyError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full h-8 px-3 text-xs font-semibold hover:bg-muted"
                        onClick={handleCancelReply}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!replyInput.trim() || isPostingComment}
                        className="rounded-full h-8 px-4 text-xs font-semibold gap-1"
                      >
                        {isPostingComment ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Reply
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 px-3 mt-1 gap-1.5 text-xs font-semibold text-primary hover:bg-muted hover:text-primary"
                  onClick={handleShowReplies}
                >
                  {showReplies ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {displayReplyCount}{" "}
                  {displayReplyCount === 1 ? "reply" : "replies"}
                </Button>
              )}

              <AnimatePresence initial={false}>
                {showReplies && (
                  <motion.div
                    key="replies-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mt-2 pl-4 border-l-2 border-border/60 space-y-2 overflow-hidden"
                  >
                    {isRepliesLoading ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading replies...
                      </div>
                    ) : isRepliesError ? (
                      <p className="text-xs text-destructive font-medium py-2">
                        Failed to load replies.
                      </p>
                    ) : replies.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No replies yet.
                      </p>
                    ) : (
                      <>
                        {replies.map((reply) => (
                          <CommentItem key={reply.commentId} comment={reply} />
                        ))}
                        {hasMoreReplies && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full h-8 px-3 gap-1.5 text-xs font-semibold"
                            disabled={isFetchingMoreReplies}
                            onClick={() => fetchMoreReplies()}
                          >
                            {isFetchingMoreReplies ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            Show more replies
                          </Button>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
        {commentSettings && comment.userId === user?.id && (
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
                if (comment.userId !== user?.id) return
                setCommentSettings(false)
                setReplyMode(false)
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
                if (comment.userId !== user?.id) return
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
