import { type PaginatedType } from "../types/paginatedType"
import axiosInstance from "./api"

export interface CommentResponse {
  commentId: string
  content: string
  isEditted: boolean
  userId: string
  videoId: string
  userName: string
  userProfileImage: string
  createdAt: string
  replyCount: number
}

export const postCommentOnVideo = async ({
  videoId,
  content,
  parentId,
}: {
  videoId: string
  content: string
  parentId?: string
}) => {
  const res = await axiosInstance.post<PaginatedType<CommentResponse>>(
    `/api/v1/comments/${videoId}`,
    { content, parentId }
  )
  return res.data
}

export const getRecentCommentsOfOwnerChannel = async (
  pageNumber: number = 1,
  pageSize: number = 10
) => {
  const res = await axiosInstance.get<{
    items: {
      id: string
      content: string
      user: { id: string; name: string; avatarUrl: string | null }
      createdAt: Date
      updatedAt: Date
      video: {
        id: string
        title: string
        thumbnailUrl: string | null
      }
    }[]
    pageNumber: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }>("/api/v1/comments", {
    params: { pageNumber, pageSize },
  })
  return res.data
}

export const getCommentsOfVideo = async (
  videoId: string,
  pageNumber: number,
  pageSize: number,
  sort: "asc" | "desc" = "asc"
) => {
  const res = await axiosInstance.get<PaginatedType<CommentResponse>>(
    `/api/v1/comments/${videoId}`,
    { params: { page: pageNumber, limit: pageSize, sort } }
  )
  return res.data
}

export const getRepliesOfComment = async (
  commentId: string,
  pageNumber: number = 1,
  pageSize: number = 10
) => {
  const res = await axiosInstance.get<CommentResponse[]>(
    `/api/v1/comments/${commentId}/replies`
  )
  return res.data
}

export const updateComment = async ({
  commentId,
  content,
}: {
  commentId: string
  content: string
}) => {
  const res = await axiosInstance.patch(`/api/v1/comments/${commentId}`, {
    content,
  })
  return res.data
}

export const deleteComment = async ({ commentId }: { commentId: string }) => {
  const res = await axiosInstance.delete(`/api/v1/comments/${commentId}`)
  return res.data
}
