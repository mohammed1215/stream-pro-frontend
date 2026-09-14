import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Film,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Tag as TagIcon,
  UploadCloud,
  X,
} from "lucide-react"
import { useVideoUpload } from "../hooks/useVideoUpload"
import axiosInstance from "../lib/api"
import { useQuery } from "@tanstack/react-query"
import { DateTimePicker } from "./DateTimePicker"

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

type Step = 1 | 2 | 3

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Media" },
  { id: 2, label: "Details" },
  { id: 3, label: "Publish" },
]

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                currentStep === s.id
                  ? "bg-cyan-600 text-white dark:bg-cyan-500"
                  : currentStep > s.id
                  ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {currentStep > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
            </div>
            <span
              className={`hidden text-[11px] font-semibold sm:inline ${
                currentStep === s.id
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px flex-1 transition-colors ${
                currentStep > s.id
                  ? "bg-cyan-400"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          )}
        </div>
      ))}
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
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [publishTime, setPublishTime] = useState("")

  const {
    uploadVideo,
    cancelUpload,
    videoProgress,
    thumbnailProgress,
    uploadStep,
    isUploading,
    reset: resetUploadState,
  } = useVideoUpload()

  const minPublishTimeRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    minPublishTimeRef.current = new Date(Date.now() + 60_000)
      .toISOString()
      .slice(0, 16)
  }, [])

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
    setStep(1)
    setDirection(1)
    setVideoFile(null)
    setThumbnailFile(null)
    setTitle("")
    setDescription("")
    setTags([])
    setCategoryId(null)
    setError(null)
    setIsScheduled(false)
    setPublishTime("")
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

  const selectedCategoryName = categories?.find(
    (c) => c.id === categoryId
  )?.name

  const goToStep = (target: Step) => {
    setDirection(target > step ? 1 : -1)
    setError(null)
    setStep(target)
  }

  const handleContinueFromMedia = () => {
    if (!videoFile) {
      setError("Please select a video file to continue.")
      return
    }
    goToStep(2)
  }

  const handleContinueFromDetails = () => {
    if (!title.trim() || !description.trim() || !categoryId?.trim()) {
      setError("Title, description, and category are required.")
      return
    }
    goToStep(3)
  }

  const validateSchedule = (): string | null | undefined => {
    if (!isScheduled) return undefined
    if (!publishTime) {
      setError("Please select a publish date and time.")
      return null
    }
    const scheduledDate = new Date(publishTime)
    if (scheduledDate.getTime() <= Date.now()) {
      setError("Scheduled time must be in the future.")
      return null
    }
    return scheduledDate.toISOString()
  }

  const handleCreateVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (step === 1) {
      handleContinueFromMedia()
      return
    }
    if (step === 2) {
      handleContinueFromDetails()
      return
    }

    setError(null)

    if (
      !videoFile ||
      !title.trim() ||
      !description.trim() ||
      !categoryId?.trim()
    ) {
      setError("Something's missing — please review the previous steps.")
      return
    }

    const publishTimeISO = validateSchedule()
    if (publishTimeISO === null) return

    try {
      await uploadVideo({
        title: title.trim(),
        description: description.trim(),
        tags,
        categoryId,
        videoFile,
        thumbnailFile,
        publishTime: publishTimeISO ?? undefined,
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

  const stepVariants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, x: dir * 24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: dir * -24 }),
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.form
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onSubmit={handleCreateVideo}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
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

            <StepIndicator currentStep={step} />

            <div className="relative min-h-[360px]">
              <AnimatePresence mode="wait" custom={direction}>
                {/* ============ STEP 1: MEDIA ============ */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
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
                        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
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
                        <UploadCloud className="mb-2 h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {videoFile
                            ? videoFile.name
                            : "Drag video here or browse"}
                        </p>
                        <span className="mt-0.5 text-[11px] text-slate-400">
                          MP4, WebM, or MOV
                        </span>
                      </div>
                    </div>

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
                  </motion.div>
                )}

                {/* ============ STEP 2: DETAILS ============ */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
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
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="modal-category"
                          disabled={isUploading || isCategoriesLoading}
                          value={categoryId ?? ""}
                          onChange={(e) =>
                            setCategoryId(e.target.value || null)
                          }
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:bg-transparent"
                        >
                          <option
                            value=""
                            className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                          >
                            {isCategoriesLoading
                              ? "Loading categories..."
                              : "Select a category"}
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

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Tags
                      </label>
                      <TagsInput tags={tags} setTags={setTags} />
                    </div>
                  </motion.div>
                )}

                {/* ============ STEP 3: PUBLISH & REVIEW ============ */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Scheduled Publishing */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Schedule publish time
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Publish immediately after processing, or pick a
                            later time
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isScheduled}
                          disabled={isUploading}
                          onClick={() => {
                            setIsScheduled((prev) => !prev)
                            setError(null)
                          }}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                            isScheduled
                              ? "bg-cyan-600 dark:bg-cyan-500"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              isScheduled ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isScheduled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <DateTimePicker
                              value={publishTime}
                              onChange={(value) => setPublishTime(value)}
                              minDate={minPublishTimeRef.current}
                            />
                            <p className="mt-1.5 text-[10px] text-slate-400">
                              Times are in your local timezone
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Review Summary */}
                    {!isUploading && (
                      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                          Review before publishing
                        </p>

                        <div className="flex items-start gap-2 text-[11px]">
                          <Film className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate text-slate-600 dark:text-slate-300">
                            {videoFile?.name ?? "No video selected"}
                          </span>
                        </div>

                        <div className="flex items-start gap-2 text-[11px]">
                          <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate text-slate-600 dark:text-slate-300">
                            {thumbnailFile?.name ?? "No custom thumbnail"}
                          </span>
                        </div>

                        <div className="flex items-start gap-2 text-[11px]">
                          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-center text-slate-400">
                            #
                          </span>
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                            {title || "Untitled video"}
                          </span>
                        </div>

                        {selectedCategoryName && (
                          <div className="flex items-start gap-2 text-[11px]">
                            <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 rotate-[-90deg] text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {selectedCategoryName}
                            </span>
                          </div>
                        )}

                        {tags.length > 0 && (
                          <div className="flex items-start gap-2 text-[11px]">
                            <TagIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {tags.join(", ")}
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-2 text-[11px]">
                          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">
                            {isScheduled && publishTime
                              ? `Scheduled for ${new Date(
                                  publishTime
                                ).toLocaleString()}`
                              : "Publish immediately after processing"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Upload Progress */}
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3.5 dark:border-cyan-900/40 dark:bg-cyan-950/20"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{getStatusText()}</span>
                        </div>

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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-3">
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleContinueFromMedia}
                  disabled={isUploading}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="flex w-1/3 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueFromDetails}
                    className="flex w-2/3 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                  >
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <button
                    type="button"
                    onClick={isUploading ? handleClose : () => goToStep(2)}
                    className="flex w-1/3 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isUploading ? (
                      "Cancel"
                    ) : (
                      <>
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex w-2/3 items-center justify-center rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
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
                </>
              )}
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  )
}
