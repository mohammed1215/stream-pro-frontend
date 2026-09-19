import { Content, Portal, Root, Trigger } from "@radix-ui/react-popover"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Button } from "../ui/button"
import { toast } from "react-toastify"
import { useState } from "react"
import { PlaylistIcon } from "@vidstack/react/icons"
import { useAuth } from "../../features/Auth/hooks/useAuth"
import { usePlaylistModal } from "../../hooks/usePlaylistModal"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  addVideoToPlaylist,
  getPlaylistsWithHasVideo,
  removeVideoFromPlaylist,
  type Playlist,
} from "../../lib/playlists"
import { Check, Loader2, Plus, Save } from "lucide-react"
import { cn } from "../../lib/utils"
import {
  addToWatchLater,
  getWatchLaterStatus,
  removeFromWatchLater,
} from "../../lib/watchlater"
import { GhostButton } from "../GhostButton"

function DropdownWrapper({
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

function WatchLaterItem({
  videoId,
  onClose,
}: {
  videoId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  // Query key is scoped per videoId - without this every WatchLaterItem
  // instance on the page would share one cache entry and show the wrong
  // saved-state for other videos.
  const statusQueryKey = ["watch-later-status", videoId]

  const { data, isPending: isLoadingStatus } = useQuery({
    queryKey: statusQueryKey,
    queryFn: () => getWatchLaterStatus(videoId),
  })
  const isInWatchLater = data?.isInWatchLater ?? false

  const invalidateStatus = () => {
    queryClient.invalidateQueries({ queryKey: statusQueryKey })
    queryClient.invalidateQueries({ queryKey: ["watch-later"] })
  }

  const { mutate: saveToWatchLater, isPending: isSaving } = useMutation({
    mutationFn: () => addToWatchLater(videoId),
    onSuccess: () => {
      toast.success("Added to Watch Later", { position: "top-center" })
      invalidateStatus()
      onClose()
    },
    onError: () => toast.error("Failed to add to Watch Later"),
  })

  const { mutate: unsaveFromWatchLater, isPending: isUnsaving } = useMutation({
    mutationFn: () => removeFromWatchLater(videoId),
    onSuccess: () => {
      toast.success("Removed from Watch Later", { position: "top-center" })
      invalidateStatus()
      onClose()
    },
    onError: () => toast.error("Failed to remove from Watch Later"),
  })

  const isBusy = isSaving || isUnsaving || isLoadingStatus

  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left disabled:opacity-50"
      onClick={() => {
        if (isInWatchLater) {
          unsaveFromWatchLater()
        } else {
          saveToWatchLater()
        }
      }}
      disabled={isBusy}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
          isInWatchLater
            ? "bg-primary/10 border-primary/20 text-primary"
            : "bg-muted border-border text-muted-foreground"
        )}
      >
        {isInWatchLater ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </div>
      <span className="text-sm font-medium truncate flex-1 text-foreground">
        Watch Later
      </span>
      {isInWatchLater && !isBusy && (
        <span className="text-xs font-semibold text-primary">Saved</span>
      )}
      {isBusy && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </button>
  )
}
const MotionButton = motion(Button)

export const PlaylistPopover = ({ videoId }: { videoId: string }) => {
  const user = useAuth((state) => state.user)
  const [open, setOpen] = useState(false)
  const openCreateModal = usePlaylistModal((s) => s.open)
  const { data: playlists, isPending: isLoadingPlaylists } = useQuery({
    queryKey: ["get-playlists", videoId],
    queryFn: () => (user && videoId ? getPlaylistsWithHasVideo(videoId) : null),
    enabled: open && !!user && !!videoId,
  })

  function onClose() {}

  return (
    <Root open={open} onOpenChange={setOpen}>
      <Trigger asChild>
        <MotionButton
          variant="secondary"
          className="h-9 px-3.5 w-full bg-transparent! hover:bg-secondary! text-start! justify-start text-sm font-medium gap-2 transition-colors border border-border/40"
          onClick={(e) => {
            if (!user) {
              e.preventDefault()
              toast.error("Login to save videos")
            }
          }}
        >
          <PlaylistIcon className="h-4 w-4 text-muted-foreground" />
          <span>Save</span>
        </MotionButton>
      </Trigger>

      <AnimatePresence>
        {open && (
          <Portal forceMount>
            <Content align="start" sideOffset={8} asChild>
              <DropdownWrapper isOpen={open} onClose={onClose}>
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
                      <WatchLaterItem videoId={videoId} onClose={onClose} />

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
                      openCreateModal()
                      onClose()
                    }}
                  >
                    <Plus className="h-4 w-4" /> New Playlist
                  </GhostButton>
                </div>
              </DropdownWrapper>
            </Content>
          </Portal>
        )}
      </AnimatePresence>
    </Root>
  )
}
