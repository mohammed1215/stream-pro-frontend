import { formatNumber } from "../../lib/helpers"
import dayjs from "../../lib/dayjs"
import type { ChannelData } from "./channelTypes"

export const ChannelAboutTab = ({
  channelData,
}: {
  channelData: ChannelData
}) => {
  return (
    <div className="channel-about-container">
      <div className="about-details-card">
        <h3>Description</h3>
        <p className="about-full-description">
          {channelData?.description || "No description provided."}
        </p>
      </div>
      <div className="about-stats-card">
        <h3>Stats</h3>
        <div className="about-stat-item">
          <span>Joined</span>
          <span>{dayjs(channelData?.createdAt).format("MMM D, YYYY")}</span>
        </div>
        <div className="about-stat-item">
          <span>Total Views</span>
          <span>{formatNumber(channelData?.totalViews)}</span>
        </div>
        <div className="about-stat-item">
          <span>Subscribers</span>
          <span>{formatNumber(channelData?.subscriptionsCount)}</span>
        </div>
        <div className="about-stat-item">
          <span>Videos</span>
          <span>{channelData?.videosCount}</span>
        </div>
      </div>
    </div>
  )
}
