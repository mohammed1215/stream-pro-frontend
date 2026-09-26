import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { getRecentCommentsOfOwnerChannel } from "../lib/comment"
import { useState } from "react"

const PAGE_SIZE = 5

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export const StudioCommentsPage = () => {
  const [page, setPage] = useState(1)

  const commentsQuery = useQuery({
    queryKey: ["comments", page, PAGE_SIZE],
    queryFn: () => getRecentCommentsOfOwnerChannel(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })

  const data = commentsQuery.data
  const isFetching = commentsQuery.isFetching

  if (commentsQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading comments...
      </div>
    )
  }

  if (commentsQuery.isError) {
    return (
      <div className="flex items-center justify-center py-16 text-destructive">
        Something went wrong: {commentsQuery.error.message}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 bg-background text-(--foreground)">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-(--text-h)">
          Recent Comments
        </h1>
        <span className="text-sm text-muted-foreground">
          {data?.totalCount ?? 0} comments
        </span>
      </div>

      <div
        className={`space-y-3 transition-opacity ${
          isFetching ? "opacity-50" : "opacity-100"
        }`}
      >
        {data?.items.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            No comments yet
          </div>
        )}

        {data?.items.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-3 rounded-lg border border-border bg-(--background-secondary) p-3 hover:bg-(--background-secondary-hover)sition-colors"
          >
            {/* Avatar */}
            {comment.user.avatarUrl ? (
              <img
                src={comment.user.avatarUrl}
                alt={comment.user.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: "var(--accent-ui)",
                  color: "var(--accent-foreground)",
                }}
              >
                {getInitials(comment.user.name)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-(--text-h)cate">
                  {comment.user.name}
                </span>
                <time
                  dateTime={new Date(comment.createdAt).toISOString()}
                  className="text-xs text-muted-foreground shrink-0"
                >
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs italic text-muted-foreground">
                    (edited)
                  </span>
                )}
              </div>

              <p className="text-sm text-(--text) line-clamp-2 mt-0.5">
                {comment.content}
              </p>

              {/* Video reference */}
              <div className="flex items-center gap-2 mt-2 text-xs text-accent-foreground">
                {comment.video.thumbnailUrl ? (
                  <img
                    src={comment.video.thumbnailUrl}
                    alt={comment.video.title}
                    className="w-14 h-8 object-cover rounded-md border border-border"
                  />
                ) : (
                  <div className="w-14 h-8 rounded-md border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                    —
                  </div>
                )}
                <span
                  className="truncate px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--accent-bg)" }}
                >
                  {comment.video.title}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setPage((prev) => prev - 1)}
          disabled={!data?.hasPreviousPage || isFetching}
          className="px-4 py-2 text-sm rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-(--background-secondary-hover) transition-colors"
        >
          Previous
        </button>

        <span className="text-sm text-muted-foreground">
          Page {data?.pageNumber} of {data?.totalPages}
        </span>

        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={!data?.hasNextPage || isFetching}
          className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
