import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { fetchChannelData } from "../lib/channel"
import "./ChannelDetailsPage.css"
import { formatNumber } from "../lib/helpers"
import { ChannelButtons } from "../components/channel/ChannelButtons"
import { ChannelAboutTab } from "../components/channel/ChannelAboutTab"
import {
  ChannelHomeTab,
  ChannelPlaylistsTab,
  ChannelVideosTab,
} from "../components/channel/ChannelTabs"
import { tabPanelVariants } from "../components/channel/channelVariants"

const TABS = [
  { key: "home", label: "Home" },
  { key: "videos", label: "Videos" },
  { key: "playlists", label: "Playlists" },
  { key: "about", label: "About" },
] as const

export const ChannelDetailsPage = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const [openDescription, setOpenDescription] = useState(false)
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["key"]>("home")

  const { data: channelData, isPending } = useQuery({
    queryKey: ["channels", channelId],
    queryFn: ({ signal }) => {
      if (!channelId) throw new Error("Channel ID is missing")
      return fetchChannelData(channelId, signal)
    },
  })

  if (isPending) {
    return <div className="channel-page-loading">Loading channel...</div>
  }

  if (!channelData) {
    return (
      <div className="channel-page-error">
        <h2>Channel Not Found</h2>
        <p>
          The channel you are looking for does not exist or has been removed.
        </p>
      </div>
    )
  }

  const characterLimit = 120
  const characters = channelData.description?.length || 0
  const shouldTruncate = characters > characterLimit && !openDescription
  const truncatedDescription = shouldTruncate
    ? channelData.description.slice(0, characterLimit) + "..."
    : channelData.description

  return (
    <motion.div
      className="channel-page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Banner / Cover */}
      <div className="channel-banner-container">
        {channelData.thumbnailUrl ? (
          <motion.img
            src={channelData.thumbnailUrl}
            alt={channelData.title}
            className="channel-banner-img"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ) : (
          <div className="channel-banner-placeholder" />
        )}
      </div>

      {/* Header Info Section */}
      <div className="channel-header-container">
        <div className="channel-header-content">
          <motion.div
            className="channel-avatar-wrapper"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.1,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <img
              src={channelData.channelImageUrl}
              alt={channelData.title}
              className="channel-avatar-img"
            />
          </motion.div>

          <motion.div
            className="channel-main-meta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h1 className="channel-main-title">{channelData.title}</h1>

            <div className="channel-quick-stats">
              <span>
                {formatNumber(channelData.subscriptionsCount)} subscribers
              </span>
              <span className="dot-divider">•</span>
              <span>{channelData.videosCount} videos</span>
              <span className="dot-divider">•</span>
              <span>{formatNumber(channelData.totalViews)} views</span>
            </div>

            {channelData.description && (
              <div className="channel-desc-box">
                <p className="channel-desc-text">
                  {truncatedDescription}
                  {characters > characterLimit && (
                    <button
                      className="desc-toggle-btn"
                      onClick={() => setOpenDescription(!openDescription)}
                    >
                      {openDescription ? " Show less" : " more"}
                    </button>
                  )}
                </p>
              </div>
            )}

            <ChannelButtons
              isSubscribed={channelData.isSubscribed}
              isOwner={channelData.isOwner}
              channelId={channelId}
            />
          </motion.div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="channel-tabs-bar">
        <div className="tabs-container">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  className="tab-underline"
                  layoutId="tab-underline"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <main className="channel-body-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabPanelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {activeTab === "home" && (
              <ChannelHomeTab
                channelId={channelId}
                isOwner={Boolean(channelData?.isOwner)}
              />
            )}
            {activeTab === "videos" && (
              <ChannelVideosTab
                channelId={channelId}
                isOwner={Boolean(channelData?.isOwner)}
              />
            )}
            {activeTab === "playlists" && (
              <ChannelPlaylistsTab channelId={channelId} />
            )}
            {activeTab === "about" && (
              <ChannelAboutTab channelData={channelData} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  )
}
