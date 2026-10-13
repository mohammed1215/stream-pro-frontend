import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { AnimatePresence, motion } from "motion/react"
import {
  Bell,
  Check,
  Share2,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react"
import {
  subscribeToChannel,
  unsubscribeToChannel,
} from "../../lib/subscriptionApi"
import type { ChannelData } from "./channelTypes"

export const ChannelButtons = ({
  isSubscribed,
  isOwner,
  channelId,
}: {
  isSubscribed: boolean
  isOwner: boolean
  channelId?: string
}) => {
  const navigate = useNavigate()
  const url = window.location.href
  const queryClient = useQueryClient()

  const { mutate: toggleSubscribe, isPending } = useMutation({
    mutationFn: async (isSubscribed: boolean) => {
      if (!channelId) {
        toast.error("Channel ID is missing", { position: "top-center" })
        return
      }
      return isSubscribed
        ? unsubscribeToChannel(channelId)
        : subscribeToChannel(channelId)
    },
    onMutate: async (isSubscribed: boolean) => {
      await queryClient.cancelQueries({ queryKey: ["channels", channelId] })

      const previousChannelData = queryClient.getQueryData<ChannelData>([
        "channels",
        channelId,
      ])

      queryClient.setQueryData<ChannelData>(
        ["channels", channelId],
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            isSubscribed: !isSubscribed,
            subscriptionsCount: isSubscribed
              ? oldData.subscriptionsCount - 1
              : oldData.subscriptionsCount + 1,
          }
        }
      )
      return { previousChannelData }
    },
    onError: (_err, _isSubscribed, context) => {
      if (context?.previousChannelData) {
        queryClient.setQueryData(
          ["channels", channelId],
          context.previousChannelData
        )
      }
      toast.error("Something went wrong", { position: "top-center" })
    },
    onSuccess: (_data, isSubscribed: boolean) => {
      toast.success(
        isSubscribed ? "Unsubscribed from channel" : "Subscribed to channel",
        {
          style: { borderRadius: "20rem" },
          hideProgressBar: true,
          position: "top-center",
        }
      )
      queryClient.invalidateQueries({ queryKey: ["channels", channelId] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", channelId] })
    },
  })

  return (
    <div className="channel-actions-group">
      {!isOwner ? (
        <>
          <motion.button
            disabled={isPending}
            className={`btn-action ${
              isSubscribed ? "btn-subscribed" : "btn-subscribe"
            }`}
            onClick={() => toggleSubscribe(isSubscribed)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSubscribed ? (
                <motion.span
                  key="subscribed"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Check size={18} />
                  <span>Subscribed</span>
                </motion.span>
              ) : (
                <motion.span
                  key="subscribe"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Bell size={18} />
                  <span>Subscribe</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            className="btn-action btn-secondary"
            disabled={!url}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              navigator.clipboard.writeText(url)
              toast.success("Channel URL copied to clipboard!", {
                style: { borderRadius: "20rem" },
                hideProgressBar: true,
                position: "bottom-center",
                closeButton(props) {
                  return (
                    <button
                      onClick={props.closeToast}
                      className="ml-3 rounded-full text-sm!"
                    >
                      <X size={15} />
                    </button>
                  )
                },
              })
            }}
          >
            <Share2 size={18} />
            <span>Share</span>
          </motion.button>
        </>
      ) : (
        <>
          <motion.button
            className="btn-action btn-primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/studio/channel/customization`)}
          >
            <SlidersHorizontal size={18} />
            <span>Customize Channel</span>
          </motion.button>
          <motion.button
            className="btn-action btn-secondary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/studio/content/`)}
          >
            <Video size={18} />
            <span>Manage Videos</span>
          </motion.button>
        </>
      )}
    </div>
  )
}
