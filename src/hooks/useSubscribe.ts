import { useMutation } from "@tanstack/react-query"
import {
  subscribeToChannel,
  unsubscribeToChannel,
} from "../lib/subscriptionApi"

export const useSubscribe = (
  channelId: string,
  onUnSubscribeMutate?: () => void,
  onSubscribeMutate?: () => void,
  signal?: AbortSignal
) => {
  const { mutate: unsubscribe } = useMutation({
    mutationFn: async () => unsubscribeToChannel(channelId, signal),
    onMutate: onUnSubscribeMutate,
  })

  const { mutate: subscribe } = useMutation({
    mutationFn: async () => subscribeToChannel(channelId, signal),
    onMutate: onSubscribeMutate,
  })

  return { subscribe, unsubscribe }
}
