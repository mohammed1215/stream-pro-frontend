import axiosInstance from "./api"

export const checkUserSubscribedToChannel = async (channelId: string) => {
  try {
    const check = await axiosInstance.get<boolean>(
      `/api/v1/subscriptions/${channelId}`
    )
    return check
  } catch (error) {
    console.log(error)
    throw error
  }
}

interface SubscribeToChannelResponse {
  message: string
  channelId: string
  userId: string
}

export const subscribeToChannel = async (
  channelId: string,
  signal?: AbortSignal
) => {
  try {
    const data = (
      await axiosInstance.post<SubscribeToChannelResponse>(
        `/api/v1/subscriptions/${channelId}`,
        { signal }
      )
    ).data
    return data
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const unsubscribeToChannel = async (
  channelId: string,
  signal?: AbortSignal
) => {
  try {
    const data = (
      await axiosInstance.delete<{ message: string }>(
        `/api/v1/subscriptions/${channelId}`,
        { signal }
      )
    ).data
    return data
  } catch (error) {
    console.log(error)
    throw error
  }
}

export interface PaginatedUserSubscriptions {
  subscriptions: [
    {
      id: string
      createdAt: string
      channel: {
        id: string
        title: string
        thumbnailUrl: string
        description: string
        subscriberCount: number
      }
    }
  ]
  hasMore: boolean
  nextCursor: string
}

export const getUserSubscriptions = async (
  cursor?: string,
  pageSize: number = 10,
  signal?: AbortSignal
) => {
  const res = await axiosInstance.get<PaginatedUserSubscriptions>(
    `/api/v1/subscriptions`,
    { params: { cursor, pageSize }, signal }
  )
  return res.data
}

export const getChannelSubscribers = async (
  pageNumber = 1,
  pageSize = 10,
  signal?: AbortSignal
) => {
  const res = await axiosInstance.get<{
    items: {
      subscriptionId: string
      channelId: string
      userId: string
      name: string
      email: string
      avatarUrl: string
      channelTitle: string
      channelThumbnailUrl: string
      channelImageUrl: string
      createdAt: string
      userChannelId: string | null
    }[]
    pageNumber: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    totalPages: number
  }>(`/api/v1/owner/subscriptions`, {
    params: { pageNumber, pageSize },
    signal,
  })
  return res.data
}
