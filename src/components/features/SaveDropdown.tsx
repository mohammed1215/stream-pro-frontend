import { Check, Loader2, Plus, Save } from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "../../features/Auth/hooks/useAuth"
import {
  addVideoToPlaylist,
  getPlaylistsWithHasVideo,
  removeVideoFromPlaylist,
  type Playlist,
} from "../../lib/playlists"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlaylistIcon } from "@vidstack/react/icons"
import { GhostButton } from "../GhostButton"
import { cn } from "../../lib/utils"

export function DropdownWrapper({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!isOpen) return null
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-background shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-right">
        {children}
      </div>
    </>
  )
}

function PlaylistItem({
  playlist,
  videoId,
  onClose,
}: {
  playlist: Playlist & { hasVideo: boolean }
  videoId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const { mutate: togglePlaylist, isPending } = useMutation({
    mutationFn: () => {
      const payload = { videoId, playlistId: playlist.playlistId }
      return playlist.hasVideo
        ? removeVideoFromPlaylist(payload)
        : addVideoToPlaylist(payload)
    },
    onSuccess: () => {
      toast.success(
        playlist.hasVideo ? "Removed from playlist" : "Added to playlist"
      )
      queryClient.invalidateQueries({ queryKey: ["get-playlists"] })
      onClose()
    },
    onError: () => toast.error("Failed to update playlist"),
  })

  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left disabled:opacity-50"
      onClick={() => togglePlaylist()}
      disabled={isPending}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
          playlist.hasVideo
            ? "bg-primary/10 border-primary/20 text-primary"
            : "bg-muted border-border text-muted-foreground"
        )}
      >
        {playlist.hasVideo ? (
          <Check className="h-4 w-4" />
        ) : (
          <PlaylistIcon className="h-4 w-4" />
        )}
      </div>
      <span className="text-sm font-medium truncate flex-1 text-foreground">
        {playlist.title}
      </span>
      {playlist.hasVideo && (
        <span className="text-xs font-semibold text-primary">Saved</span>
      )}
      {isPending && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </button>
  )
}

export function SaveDropdown({
  videoId,
  isOpen,
  onClose,
  onOpenCreateModal,
}: {
  videoId: string
  isOpen: boolean
  onClose: () => void
  onOpenCreateModal: () => void
}) {
  const { user } = useAuth()
  const { data: playlists, isPending: isLoadingPlaylists } = useQuery({
    queryKey: ["get-playlists", videoId],
    queryFn: () => (user && videoId ? getPlaylistsWithHasVideo(videoId) : null),
    enabled: isOpen && !!user && !!videoId, // Only fetch when dropdown opens! (Great performance optimization)
  })

  return (
    <DropdownWrapper isOpen={isOpen} onClose={onClose}>
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">
          Save to playlist
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {isLoadingPlaylists ? (
          <div className="px-4 py-8 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading playlists...</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left"
              onClick={() => {
                toast.info("Added to Watch Later")
                onClose()
              }}
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                <Save className="h-4 w-4 text-foreground" />
              </div>
              <span className="text-sm font-medium truncate">Watch Later</span>
            </button>

            {playlists?.map((playlist) => (
              <PlaylistItem
                key={playlist.playlistId}
                playlist={playlist}
                videoId={videoId}
                onClose={onClose}
              />
            ))}

            {playlists?.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No playlists yet.
              </div>
            )}
          </>
        )}
      </div>
      <div className="border-t border-border p-2 bg-muted/10">
        <GhostButton
          className="w-full justify-start gap-2"
          onClick={() => {
            onOpenCreateModal()
            onClose()
          }}
        >
          <Plus className="h-4 w-4" /> New Playlist
        </GhostButton>
      </div>
    </DropdownWrapper>
  )
}
