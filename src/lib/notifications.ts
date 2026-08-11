import type { PaginatedType } from "../types/paginatedType"
import axiosInstance from "./api"

export type NotificationType = "LIKE" | "COMMENT" | "PLAYLIST" | "SUBSCRIPTION"

export interface NotificationResponse {
  notificationId: string
  actorId: string
  recipientId: string
  contextId: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
}

export interface PaginedTypeNotification
  extends PaginatedType<NotificationResponse> {
  items: NotificationResponse[]
  pageSize: number
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  unreadTotal: number
}

export const fetchNotifications = async (
  pageNumber: number,
  pageSize: number = 10
): Promise<PaginedTypeNotification> => {
  const response = await axiosInstance.get<PaginedTypeNotification>(
    `/api/v1/notifications`,
    {
      params: {
        pageNumber,
        pageSize,
      },
    }
  )
  return response.data
}

export const markNotificationAsRead = async (notificationId: string) => {
  await axiosInstance.patch(`/api/v1/notifications/${notificationId}`)
}

export const markAllNotificationsAsRead = async () => {
  await axiosInstance.patch(`/api/v1/notifications`)
}
