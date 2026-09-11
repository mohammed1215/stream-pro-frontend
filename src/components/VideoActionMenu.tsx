import { useState, type CSSProperties, type HTMLProps } from "react"
import { motion, AnimatePresence, type Variants } from "motion/react"
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  flip,
  shift,
  offset,
  autoUpdate,
  FloatingPortal,
  FloatingFocusManager,
  type Placement,
  type FloatingContext,
} from "@floating-ui/react"
import {
  MoreVertical,
  Clock,
  ListPlus,
  Share2,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Plus,
  X,
  Globe,
  Lock,
} from "lucide-react"
import { toast } from "react-toastify"
import {
  addToWatchLater,
  getWatchLaterStatus,
  removeFromWatchLater,
} from "../lib/watchlater"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createPlaylist } from "../lib/playlists"
import { createPortal } from "react-dom"
import { SaveDropdown } from "./features/SaveDropdown"

export interface ActionableVideo {
  id: string
  title?: string
  thumbnailUrl?: string
  isInWatchLater?: boolean
}

interface VideoActionMenuProps {
  video: ActionableVideo
  isOwner?: boolean
  onEdit?: (video: ActionableVideo) => void
  onDelete?: (videoId: string) => void
}

const menuVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 26,
      staggerChildren: 0.03,
      delayChildren: 0.01,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.12, ease: "easeIn" },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: { opacity: 0, x: -4 },
}

const getTransformOrigin = (placement: Placement): string => {
  const [side, alignment] = placement.split("-")
  const y = side === "top" ? "bottom" : "top"
  const x =
    alignment === "end" ? "right" : alignment === "start" ? "left" : "center"
  return `${y} ${x}`
}

export const VideoActionMenu = ({
  video,
  isOwner = false,
  onEdit,
  onDelete,
}: VideoActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setIsSaveMenuOpen(false)
    }
  }
  const {
    refs: { setReference, setFloating },
    floatingStyles,
    context,
    placement,
  } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    placement: "bottom-end",
    strategy: "fixed",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ fallbackAxisSideDirection: "end" }),
      shift({ padding: 8 }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: "menu" })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ])

  return (
    <>
      <motion.button
        ref={setReference}
        type="button"
        className={`flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
          isOpen ? "bg-muted text-foreground opacity-100" : ""
        }`}
        title="More actions"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        {...getReferenceProps({
          onClick: (e) => {
            e.preventDefault()
            e.stopPropagation()
          },
        })}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <MoreVertical className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <VideoFloatingMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        context={context}
        setFloating={setFloating}
        floatingStyles={floatingStyles}
        getFloatingProps={getFloatingProps}
        onDelete={onDelete}
        onEdit={onEdit}
        video={video}
        isOwner={isOwner}
        placement={placement}
        isSaveMenuOpen={isSaveMenuOpen}
        setIsSaveMenuOpen={setIsSaveMenuOpen}
      />
    </>
  )
}

const VideoFloatingMenu = ({
  isOpen,
  setIsOpen,
  context,
  setFloating,
  floatingStyles,
  getFloatingProps,
  video,
  isOwner = false,
  onEdit,
  onDelete,
  placement,
  isSaveMenuOpen,
  setIsSaveMenuOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isOwner?: boolean
  context: FloatingContext
  setFloating: ((node: HTMLElement | null) => void) &
    ((node: HTMLElement | null) => void)
  floatingStyles: CSSProperties
  getFloatingProps: (
    userProps?: HTMLProps<HTMLElement> | undefined
  ) => Record<string, unknown>
  placement: Placement
  isSaveMenuOpen: boolean
  setIsSaveMenuOpen: (is: boolean) => void
} & VideoActionMenuProps) => {
  const queryClient = useQueryClient()

  const statusQueryKey = ["watch-later-status", video.id]

  const { data, isPending: isLoadingStatus } = useQuery({
    queryKey: statusQueryKey,
    queryFn: () => getWatchLaterStatus(video.id),
    enabled: isOpen,
  })
  const isInWatchLater = data?.isInWatchLater ?? false

  const invalidateStatus = () => {
    queryClient.invalidateQueries({ queryKey: statusQueryKey })
    queryClient.invalidateQueries({ queryKey: ["watch-later"] })
  }

  const { mutate: saveToWatchLater, isPending: isSaving } = useMutation({
    mutationFn: () => addToWatchLater(video.id),
    onSuccess: () => {
      toast.success("Added to Watch Later", { position: "top-center" })
      invalidateStatus()
      setIsOpen(false)
    },
    onError: () => toast.error("Failed to add to Watch Later"),
  })

  const { mutate: unsaveFromWatchLater, isPending: isUnsaving } = useMutation({
    mutationFn: () => removeFromWatchLater(video.id),
    onSuccess: () => {
      toast.success("Removed from Watch Later", { position: "top-center" })
      invalidateStatus()
      setIsOpen(false)
    },
    onError: () => toast.error("Failed to remove from Watch Later"),
  })

  const isBusy = isSaving || isUnsaving || isLoadingStatus

  const handleShare = () => {
    const videoUrl = `${window.location.origin}/videos/${video.id}`
    navigator.clipboard.writeText(videoUrl)
    toast.success("Video link copied to clipboard!", {
      style: { borderRadius: "20rem" },
      hideProgressBar: true,
      position: "bottom-center",
    })
    setIsOpen(false)
  }

  return (
    <FloatingPortal>
      <AnimatePresence>
        {isOpen && (
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={setFloating}
              style={{ ...floatingStyles, zIndex: 9999 }}
              {...getFloatingProps({
                onClick: (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                },
              })}
            >
              <motion.div
                className="video-dropdown-menu"
                style={{
                  transformOrigin: getTransformOrigin(placement),
                }}
                variants={menuVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  variants={itemVariants}
                  whileHover={{
                    x: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (isInWatchLater) {
                      unsaveFromWatchLater()
                    } else {
                      saveToWatchLater()
                    }
                    setIsOpen(false)
                  }}
                >
                  {isInWatchLater ? <Check size={16} /> : <Clock size={16} />}
                  <span>Watch Later</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  variants={itemVariants}
                  whileHover={{
                    x: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsSaveMenuOpen(true)
                  }}
                >
                  <ListPlus size={16} />
                  <span>Add to playlist</span>
                </motion.button>
                <SaveDropdown
                  isOpen={isSaveMenuOpen}
                  onClose={() => {
                    setIsSaveMenuOpen(false)
                    setIsOpen(false)
                  }}
                  videoId={video.id}
                />
                <motion.button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  variants={itemVariants}
                  whileHover={{
                    x: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </motion.button>

                {isOwner && (
                  <>
                    <div className="dropdown-divider" role="separator" />

                    <motion.button
                      type="button"
                      className="dropdown-item"
                      role="menuitem"
                      variants={itemVariants}
                      whileHover={{
                        x: 2,
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsOpen(false)
                        onEdit?.(video)
                      }}
                    >
                      <Pencil size={16} />
                      <span>Edit video</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      className="dropdown-item dropdown-item-danger"
                      role="menuitem"
                      variants={itemVariants}
                      whileHover={{
                        x: 2,
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsOpen(false)
                        onDelete?.(video.id)
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Delete video</span>
                    </motion.button>
                  </>
                )}
              </motion.div>
            </div>
          </FloatingFocusManager>
        )}
        {createPortal(<></>, document.body)}
      </AnimatePresence>
    </FloatingPortal>
  )
}

export const CreatePlaylistModal2 = ({
  onClose,
  isOpen,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)

  const {
    mutate: createPlaylistMutation,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: createPlaylist,
    onSuccess: (data) => {
      console.log("Playlist created successfully:", data)
    },
  })

  const handleClose = () => {
    console.log("closing")
    onClose()
  }
  const handleSubmit = () => {
    createPlaylistMutation({ title, description, isPublic })
  }
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-end justify-center sm:items-center sm:p-6">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-gray-950/45 backdrop-blur-[2px]"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-playlist-title"
            className="relative flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
                <div>
                  <h2
                    id="create-playlist-title"
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    Create playlist
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Give your playlist a name and choose who can see it.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="playlist-title"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Title
                  </label>

                  <input
                    id="playlist-title"
                    type="text"
                    autoFocus
                    placeholder="My workout playlist"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={isPending}
                    maxLength={80}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-500/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="playlist-description"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description{" "}
                    <span className="font-normal text-gray-400 dark:text-gray-500">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="playlist-description"
                    placeholder="Add a short description..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={isPending}
                    rows={3}
                    maxLength={280}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-500/20"
                  />
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        isPublic
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {isPublic ? (
                        <Globe className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {isPublic ? "Public playlist" : "Private playlist"}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isPublic
                          ? "Anyone with the link can view this playlist."
                          : "Only you can view this playlist."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="Toggle playlist visibility"
                    onClick={() => setIsPublic((previous) => !previous)}
                    disabled={isPending}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      isPublic ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        isPublic ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Error */}
                {isError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                    {error instanceof Error
                      ? error.message
                      : "Something went wrong while creating the playlist. Please try again."}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/40">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create playlist"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
