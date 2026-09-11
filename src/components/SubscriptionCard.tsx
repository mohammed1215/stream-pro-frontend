import { AnimatePresence, motion } from "framer-motion"
import { useSubscribe } from "../hooks/useSubscribe"
import { formatNumber } from "../lib/helpers"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface SubscriptionCardProps {
  subscription: {
    id: string
    createdAt: string
    channel: {
      id: string
      title: string
      thumbnailUrl: string | null
      description: string | null
      subscriberCount: number
    }
  }
}

export const SubscriptionCard = ({ subscription }: SubscriptionCardProps) => {
  const { unsubscribe, subscribe } = useSubscribe(subscription.channel.id)
  const { channel } = subscription
  const [subscribed, setSubscribed] = useState(true)
  const navigate = useNavigate()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => navigate(`/channels/${subscription.channel.id}`)}
      /* 1. الحاوية والـ Hover للوضع الداكن */
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800/60"
    >
      {/* 2. الصورة الشخصية أو الحرف البديل */}
      {channel.thumbnailUrl ? (
        <img
          src={channel.thumbnailUrl}
          alt={channel.title}
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xl font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {channel.title.charAt(0).toUpperCase()}
        </div>
      )}

      {/* 3. نصوص القناة */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
          {channel.title}
        </h2>
        {channel.description && (
          <p className="line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
            {channel.description}
          </p>
        )}
        <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
          {formatNumber(channel.subscriberCount)} subscribers
        </p>
      </div>

      {/* 4. زر الاشتراك وتأثيرات الـ Hover */}
      <motion.button
        layout
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={(e) => {
          e.stopPropagation()
          if (subscribed) {
            unsubscribe()
            setSubscribed(false)
          } else {
            subscribe()
            setSubscribed(true)
          }
        }}
        className="relative z-10 shrink-0 overflow-hidden rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={subscribed ? "unsubscribe" : "subscribe"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="block"
          >
            {subscribed ? "Unsubscribe" : "Subscribe"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}
