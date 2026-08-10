import { type PaginatedType } from "../types/paginatedType"
import axiosInstance from "./api"

export interface CommentResponse {
  commentId: string
  content: string
  isEditted: boolean
  userId: string
  userName: string
  userProfileImage: string
  createdAt: string
}

export const postCommentOnVideo = async (videoId: string, content: string) => {
  const res = await axiosInstance.post<PaginatedType<CommentResponse>>(
    `/api/v1/comments/${videoId}`,
    { content }
  )
  return res.data
}

export const getCommentsOfVideo = async (
  videoId: string,
  pageNumber: number,
  pageSize: number
) => {
  const res = await axiosInstance.get<PaginatedType<CommentResponse>>(
    `/api/v1/comments/${videoId}`,
    { params: { page: pageNumber, limit: pageSize } }
  )
  return res.data
}
