import { Link } from "react-router-dom"

export const ChannelAvatar = ({
  channelProfileImageUrl,
  channelName,
  channelId,
  size,
}: {
  channelProfileImageUrl: string | null
  channelName: string
  channelId: string
  size: string | number
}) => {
  return (
    <Link
      to={`/channels/${channelId}`}
      className={`w-${size} h-${size} rounded-full overflow-hidden flex justify-center items-center bg-red-200 border border-red-500`}
    >
      {channelProfileImageUrl ? (
        <img
          className="rounded-full object-cover"
          src={channelProfileImageUrl}
          alt={channelName}
        />
      ) : (
        <div className="  flex items-center justify-center text-lg font-semibold">
          <span className="text-red-500">
            {channelName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </Link>
  )
}
