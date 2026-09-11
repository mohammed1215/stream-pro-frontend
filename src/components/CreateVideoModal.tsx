import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Film,
  Image as ImageIcon,
  Loader2,
  Plus,
  UploadCloud,
  X,
} from "lucide-react"
import { useVideoUpload } from "../hooks/useVideoUpload"
import axiosInstance from "../lib/api"
import { useQuery } from "@tanstack/react-query"

export function TagsInput({
  tags,
  setTags,
}: {
  tags: string[]
  setTags: Dispatch<SetStateAction<string[]>>
}) {
  const [tagInput, setTagInput] = useState("")

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed) return

    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }

    setTagInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add tags (press Enter)..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:bg-background"
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={!tagInput.trim()}
          className="inline-flex h-9.5 items-center justify-center gap-1 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-500/15 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                className="group -mr-1 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-cyan-600/20 dark:hover:bg-cyan-300/20"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3 text-cyan-700/70 transition-colors group-hover:text-cyan-900 dark:text-cyan-300/70 dark:group-hover:text-cyan-100" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
export const CreateVideoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const {
    uploadVideo,
    cancelUpload,
    videoProgress,
    thumbnailProgress,
    uploadStep,
    isUploading,
    reset: resetUploadState,
  } = useVideoUpload()

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null)
      return
    }
    const url = URL.createObjectURL(thumbnailFile)
    setThumbnailPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [thumbnailFile])

  const resetForm = () => {
    setVideoFile(null)
    setThumbnailFile(null)
    setTitle("")
    setDescription("")
    setTags([])
    setCategoryId(null)
    setError(null)
    resetUploadState()
  }

  const handleClose = () => {
    if (isUploading) {
      const confirmCancel = window.confirm(
        "A video upload is currently in progress. Do you want to cancel the upload?"
      )
      if (!confirmCancel) return
      cancelUpload()
    }
    resetForm()
    onClose()
  }

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return axiosInstance
        .get<{ id: string; name: string }[]>("/api/v1/categories")
        .then((res) => res.data)
    },
  })

  const handleCreateVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!videoFile || !title.trim() || !description.trim()) {
      setError("Video file, title, and description are required.")
      return
    }

    try {
      await uploadVideo({
        title: title.trim(),
        description: description.trim(),
        tags,
        categoryId,
        videoFile,
        thumbnailFile,
      })

      resetForm()
      onClose()
    } catch (err: any) {
      if (err.name === "CanceledError" || err?.name === "AbortError") return
      const message =
        err.response?.data?.message || "Upload failed. Please try again."
      setError(message)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith("video/")) {
      setVideoFile(file)
      setError(null)
    }
  }

  // Get status message for the current step
  const getStatusText = () => {
    switch (uploadStep) {
      case "initiating":
        return "Preparing upload..."
      case "uploading-video":
        return `Video uploading... (${videoProgress}%)`
      case "uploading-thumbnail":
        return `Thumbnail uploading... (${thumbnailProgress}%)`
      case "finalizing":
        return "Finalizing on server..."
      default:
        return "Uploading media..."
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Dialog */}
          <motion.form
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onSubmit={handleCreateVideo}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload a video
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Drag and Drop Video */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Video file <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (!isUploading) setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (!isUploading) {
                      document.getElementById("video-input")?.click()
                    }
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
                    isUploading
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900"
                      : isDragging
                      ? "cursor-pointer border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20"
                      : "cursor-pointer border-slate-200 bg-slate-50/50 hover:border-cyan-500 hover:bg-cyan-50/30 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-cyan-500/60"
                  }`}
                >
                  <input
                    id="video-input"
                    type="file"
                    accept="video/*"
                    disabled={isUploading}
                    className="hidden"
                    onChange={(e) => {
                      setVideoFile(e.target.files?.[0] ?? null)
                      setError(null)
                    }}
                  />
                  <UploadCloud className="mb-2 h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {videoFile ? videoFile.name : "Drag video here or browse"}
                  </p>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    MP4, WebM, or MOV
                  </span>
                </div>
              </div>

              {/* Thumbnail Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Thumbnail (optional)
                </label>
                <div className="flex items-center gap-3">
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-12 w-20 rounded-lg border border-slate-200 object-cover dark:border-slate-800"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) =>
                      setThumbnailFile(e.target.files?.[0] ?? null)
                    }
                    className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cyan-700 hover:file:bg-cyan-100 disabled:opacity-50 dark:file:bg-cyan-950/50 dark:file:text-cyan-300"
                  />
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label
                  htmlFor="modal-title"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-title"
                  type="text"
                  maxLength={100}
                  disabled={isUploading}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setError(null)
                  }}
                  placeholder="Add a clear, catchy title"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-transparent"
                />
              </div>

              {/* Description Input */}
              <div>
                <label
                  htmlFor="modal-description"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="modal-description"
                  rows={3}
                  disabled={isUploading}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setError(null)
                  }}
                  placeholder="Tell viewers what your video is about..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="modal-category"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Category
                </label>

                <div className="relative">
                  <select
                    id="modal-category"
                    disabled={isUploading || isCategoriesLoading}
                    value={categoryId ?? ""}
                    onChange={(e) => setCategoryId(e.target.value || null)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-transparent"
                  >
                    <option
                      value=""
                      className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                    >
                      {isCategoriesLoading
                        ? "Loading categories..."
                        : "Select a category (optional)"}
                    </option>

                    {categories?.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    {isCategoriesLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
              <TagsInput tags={tags} setTags={setTags} />

              {/* Dual Progress Indicators */}
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3.5 dark:border-cyan-900/40 dark:bg-cyan-950/20"
                >
                  {/* Status Banner */}
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{getStatusText()}</span>
                  </div>

                  {/* 1. Video Progress Indicator */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Film className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                        {uploadStep === "uploading-video"
                          ? "Video uploading..."
                          : videoProgress === 100
                          ? "Video uploaded"
                          : "Video pending"}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {videoProgress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-600 transition-all duration-200 dark:bg-cyan-500"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. Thumbnail Progress Indicator */}
                  {thumbnailFile && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                          <ImageIcon className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                          {uploadStep === "uploading-thumbnail"
                            ? "Thumbnail uploading..."
                            : thumbnailProgress === 100
                            ? "Thumbnail uploaded"
                            : "Thumbnail queued"}
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                          {thumbnailProgress}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-cyan-600 transition-all duration-200 dark:bg-cyan-500"
                          style={{ width: `${thumbnailProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error Alert */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key={error}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {isUploading && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-1/3 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`flex items-center justify-center rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 ${
                    isUploading ? "w-2/3" : "w-full"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Create video"
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  )
}
