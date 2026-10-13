import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpDown, Loader2 } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import type { CommentResponse } from "../../../lib/comment"
import type { PaginatedType } from "../../../types/paginatedType"
import { useAuth } from "../../Auth/hooks/useAuth"
import { CommentItem, UserAvatar } from "./CommentItem"
import { itemFadeVariants } from "./videoPageVariants"

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
