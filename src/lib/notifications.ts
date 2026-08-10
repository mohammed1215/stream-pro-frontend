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

export const fetchNotifications = async (
  pageNumber: number,
  pageSize: number = 10
): Promise<PaginatedType<NotificationResponse>> => {
  const response = await axiosInstance.get<PaginatedType<NotificationResponse>>(
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
