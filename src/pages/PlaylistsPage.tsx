import { useQuery } from "@tanstack/react-query"
import { getPlaylists, type Playlist } from "../lib/playlists"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  Play,
  Globe,
  Lock,
  ListVideo,
  Plus,
  ListPlus,
  AlertCircle,
  Film,
  ArrowRight,
} from "lucide-react"
import { CreatePlaylistModal } from "../components/CreatePlaylistModal"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

dayjs.extend(relativeTime)

// --- Sub Components ---
const PlaylistCard = ({ playlist }: { playlist: Playlist }) => {
  const navigate = useNavigate()
  const isEmpty = playlist.videoCount === 0

  return (
    <div
      className={`group relative flex flex-col transition-all duration-200 rounded-xl p-4 border ${
        isEmpty
          ? "cursor-default border-border bg-card/80"
          : "bg-card hover:bg-accent/50 cursor-pointer border-border hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl"
      }`}
      onClick={() => {
        if (!isEmpty) {
          navigate(
            `/videos/${playlist.firstVideoId}?list=${playlist.playlistId}`
          )
        }
      }}
    >
      {/* Thumbnail Container */}
      <div
        className={`relative aspect-square rounded-lg overflow-hidden bg-muted mb-4 shadow-md transition-shadow ${
          !isEmpty && "group-hover:shadow-lg"
        }`}
      >
        {playlist.thumbnailUrl ? (
          <img
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              !isEmpty && "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <ListVideo className="w-12 h-12 text-primary/50" />
          </div>
        )}

        {/* Public/Private Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md flex items-center gap-1.5 backdrop-blur-md shadow-sm ${
              playlist.isPublic
                ? "bg-green-500/20 text-green-100 border border-green-400/30"
                : "bg-black/40 text-primary-foreground/90 border border-white/10"
            }`}
          >
            {playlist.isPublic ? (
              <Globe className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
            {playlist.isPublic ? "Public" : "Private"}
          </span>
        </div>

        {/* Play Overlay on Hover (Only visible if NOT empty) */}
        {!isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <Play className="w-6 h-6 ml-1" fill="currentColor" />
            </button>
          </div>
        )}

        {/* Empty Overlay (Only visible if empty) */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <span className="text-primary-foreground/90 text-sm font-semibold px-3 py-1 bg-black/40 rounded-full border border-white/10 shadow-lg">
              No videos
            </span>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-1">
        <h3
          className={`font-semibold text-lg text-foreground line-clamp-1 transition-colors mb-1 ${
            !isEmpty && "group-hover:text-primary"
          }`}
        >
          {playlist.title}
        </h3>

        {playlist.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
            {playlist.description}
          </p>
        ) : (
          <div className="mb-3 flex-1" />
        )}

        {/* Metadata Footer */}
        <div className="mt-auto pt-3 border-t border-border/50 flex flex-col gap-2.5">
          {/* Top Row: Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Film className="w-3.5 h-3.5" />
              {playlist.videoCount}{" "}
              {playlist.videoCount === 1 ? "video" : "videos"}
            </span>
            <span className="text-[11px]">
              Updated {dayjs(playlist.updatedAt).fromNow()}
            </span>
          </div>

          {/* Bottom Row: Action Button (or Disabled State) */}
          {isEmpty ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground bg-muted rounded-lg cursor-not-allowed">
              Empty playlist
            </div>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-200 hover:gap-3"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/playlist?list=${playlist.playlistId}`)
              }}
            >
              View full playlist
              <ArrowRight className="w-3.5 h-3.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const PlaylistsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="flex flex-col bg-card rounded-xl p-4 border border-border"
      >
        <div className="aspect-square bg-muted rounded-lg mb-4 animate-pulse" />
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-3" />
        <div className="h-3 w-full bg-muted/50 rounded animate-pulse mb-1.5" />
        <div className="h-3 w-2/3 bg-muted/50 rounded animate-pulse mb-4" />
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="h-3 w-16 bg-muted/70 rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted/70 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

const ErrorState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5">
    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-destructive" />
    </div>
    <h2 className="text-xl font-semibold mb-2 text-destructive">
      Failed to load playlists
    </h2>
    <p className="text-muted-foreground max-w-sm">
      We couldn't fetch your playlists. Please check your connection and try
      again.
    </p>
  </div>
)

const EmptyPlaylistsState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-accent/10">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <ListPlus className="w-8 h-8 text-muted-foreground" />
    </div>
    <h2 className="text-xl font-semibold mb-2">
      You don't have any playlists yet
    </h2>
    <p className="text-muted-foreground max-w-sm mb-6">
      Create your first playlist to organize your favorite videos.
    </p>
    <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Create Playlist
    </button>
  </div>
)

// --- Main Component ---

export const PlaylistsPage = () => {
  const {
    data: playlists,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["playlists"],
    queryFn: getPlaylists,
  })
  const [, setIsPlaylistModalOpened] = useState(false)

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-muted/50 rounded animate-pulse" />
        </div>
        <PlaylistsSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-8">
        <ErrorState />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Playlists</h1>
          <p className="text-muted-foreground mt-1">
            Organize and manage your video collections.
          </p>
        </div>
        <button
          onClick={() => setIsPlaylistModalOpened(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          New Playlist
        </button>
      </div>

      {/* Grid or Empty State */}
      {playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.playlistId} playlist={playlist} />
          ))}
        </div>
      ) : (
        <EmptyPlaylistsState />
      )}

      <CreatePlaylistModal />
    </div>
  )
}
