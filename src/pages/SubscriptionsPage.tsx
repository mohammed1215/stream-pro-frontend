import { useInfiniteQuery } from "@tanstack/react-query"
import { AnimatePresence, motion, useInView } from "framer-motion"
import { getUserSubscriptions } from "../lib/subscriptionApi"
import { useEffect, useRef } from "react"
import { SubscriptionCard } from "../components/SubscriptionCard"
import { Loader, Users } from "lucide-react"

export const SubscriptionsPage = () => {
  const pageSize = 1

  const sentinelRef = useRef(null)
  const isInView = useInView(sentinelRef, { once: false })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["subscriptions", pageSize],
      queryFn: ({ pageParam, signal }) =>
        getUserSubscriptions(pageParam, pageSize, signal),
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialPageParam: undefined as string | undefined,
    })

  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const subscriptions = data?.pages.flatMap((page) => page.subscriptions) ?? []

  return (
    <div className="mx-auto flex flex-col gap-6 p-6">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Subscriptions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Channels you follow, all in one place
        </p>
      </div>

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
        </div>
      ) : subscriptions.length === 0 ? (
        /* 3. Empty State */
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-800">
          <Users className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-600 dark:text-gray-300">
            No subscriptions yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Channels you subscribe to will show up here
          </p>
        </div>
      ) : (
        /* 4. Subscriptions List */
        <motion.div
          className="flex flex-col gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          <AnimatePresence>
            {subscriptions.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <div ref={sentinelRef} />

      {/* 5. Infinite Scroll Loader */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
        </div>
      )}
    </div>
  )
}
