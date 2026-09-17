// src/components/CreatePlaylistModal.tsx
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Globe, Loader2, Lock, X } from "lucide-react"
import { createPlaylist } from "../lib/playlists"
import { usePlaylistModal } from "../hooks/usePlaylistModal"

export const CreatePlaylistModal = () => {
  const { isOpen, close } = usePlaylistModal()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const queryClient = useQueryClient()

  const {
    mutate: createPlaylistMutation,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-playlists"] })
      queryClient.invalidateQueries({ queryKey: ["playlists"] })
      handleClose()
    },
  })

  const handleClose = () => {
    setTitle("")
    setDescription("")
    setIsPublic(true)
    reset()
    close()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim() || isPending) return
    createPlaylistMutation({
      title: title.trim(),
      description: description.trim(),
      isPublic,
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-999999 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-gray-950/45 backdrop-blur-[2px]"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

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

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
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
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                    maxLength={80}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-500/20"
                  />
                </div>

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
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending}
                    rows={3}
                    maxLength={280}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-500/20"
                  />
                </div>

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
                    onClick={() => setIsPublic((prev) => !prev)}
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

                {isError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                    {error instanceof Error
                      ? error.message
                      : "Something went wrong while creating the playlist. Please try again."}
                  </div>
                )}
              </div>

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
                  disabled={!title.trim() || isPending}
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
