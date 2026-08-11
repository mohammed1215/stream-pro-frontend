import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Globe, Loader2, Lock, X } from "lucide-react"
import { createPlaylist } from "../lib/playlists"

export const CreatePlaylistModal = ({ open, onClose }) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  const [shouldRender, setShouldRender] = useState(open)
  const [closing, setClosing] = useState(false)

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
      onClose()
    },
  })

  // Handles enter/exit rendering
  useEffect(() => {
    if (open) {
      setShouldRender(true)
      setClosing(false)
      return
    }

    if (!shouldRender) return

    setClosing(true)

    const timeout = setTimeout(() => {
      setShouldRender(false)
      setClosing(false)
    }, 200)

    return () => clearTimeout(timeout)
  }, [open, shouldRender])

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return

    setTitle("")
    setDescription("")
    setIsPublic(true)
    reset()
  }, [open, reset])

  // Escape key + body scroll lock
  useEffect(() => {
    if (!shouldRender) return

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && !closing) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [shouldRender, closing, onClose])

  if (!shouldRender) return null

  const overlayAnimation = closing
    ? "modal-overlay-exit"
    : "modal-overlay-enter"

  const panelAnimation = closing ? "modal-panel-exit" : "modal-panel-enter"

  const canSubmit = title.trim().length > 0 && !isPending

  const handleClose = () => {
    if (!closing) {
      onClose()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!title.trim() || isPending) return

    createPlaylistMutation({
      title: title.trim(),
      description: description.trim(),
      isPublic,
    })
  }

  return (
    <div
      className={`fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-6 ${
        closing ? "pointer-events-none" : ""
      }`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-gray-950/45 backdrop-blur-[2px] ${overlayAnimation}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-playlist-title"
        className={`relative flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl ${panelAnimation}`}
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
              disabled={!canSubmit}
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
      </div>
    </div>
  )
}
