import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import {
  ArrowLeft,
  Loader2,
  Upload,
  Film,
  ImageIcon,
  Save,
  AlertCircle,
  CheckCircle2,
  Globe,
  Lock,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  X,
  Clock,
  Tag,
  FolderOpen,
} from "lucide-react"
import {
  updateVideoDetails,
  type VideoDetailResponse,
  ownerVideoDetails,
  getVideoThumbnailSignatureApi,
  uploadThumbnailToCloudApi,
  confirmUploadThumbnailApi,
  getVideoMediaSignatureApi,
  uploadVideoToCloudApi,
  confirmUploadVideoApi,
  updateVideoStatus,
} from "../lib/video"
import { getCategoriesApi } from "../lib/category"
import { DateTimePicker } from "../components/DateTimePicker"
import { cn } from "../lib/utils"

export const StudioEditVideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  const [categoryId, setCategoryId] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [publishTime, setPublishTime] = useState("")

  const toDatetimeLocalValue = (iso: string) => {
    const date = new Date(iso)
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
  }

  // Upload Progress Tracking
  const [thumbnailProgress, setThumbnailProgress] = useState<number | null>(
    null
  )
  const [mediaProgress, setMediaProgress] = useState<number | null>(null)

  // 🛑 Abort Controllers for Uploads
  const thumbnailAbortRef = useRef<AbortController | null>(null)
  const mediaAbortRef = useRef<AbortController | null>(null)

  const {
    data: video,
    isLoading,
    isError,
  } = useQuery<VideoDetailResponse, Error>({
    queryKey: ["video", videoId],
    queryFn: () => ownerVideoDetails(videoId!),
    enabled: !!videoId,
  })

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesApi,
    staleTime: 1000 * 60 * 10,
  })

  const MAX_TAGS = 15

  const handleAddTag = () => {
    const value = tagInput.trim()
    if (!value) return
    if (tags.includes(value)) {
      setTagInput("")
      return
    }
    if (tags.length >= MAX_TAGS) {
      showToast(`You can add up to ${MAX_TAGS} tags`, "error")
      return
    }
    setTags((prev) => [...prev, value])
    setTagInput("")
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const hasChanges =
    video &&
    (title !== video.title ||
      description !== (video.description || "") ||
      categoryId !== (video.categoryId || "") ||
      JSON.stringify(tags) !==
        JSON.stringify(video.tags?.map((t) => t.name) || []) ||
      (!video.isPublished &&
        publishTime !==
          (video.publishTime ? toDatetimeLocalValue(video.publishTime) : "")))

  useEffect(() => {
    if (video) {
      setTitle(video.title || "")
      setDescription(video.description || "")
      setCategoryId(video.categoryId || "")
      setTags(video.tags?.map((t) => t.name) || [])
      setPublishTime(
        video.publishTime ? toDatetimeLocalValue(video.publishTime) : ""
      )
    }
  }, [video])

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      thumbnailAbortRef.current?.abort()
      mediaAbortRef.current?.abort()
    }
  }, [])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleCopyLink = () => {
    if (!videoId) return
    navigator.clipboard.writeText(`${window.location.origin}/videos/${videoId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast("Share link copied to clipboard", "success")
  }

  const handleCancelThumbnailUpload = () => {
    if (thumbnailAbortRef.current) {
      thumbnailAbortRef.current.abort()
      thumbnailAbortRef.current = null
      setThumbnailProgress(null)
      showToast("Thumbnail upload cancelled", "error")
    }
  }

  const handleCancelMediaUpload = () => {
    if (mediaAbortRef.current) {
      mediaAbortRef.current.abort()
      mediaAbortRef.current = null
      setMediaProgress(null)
      showToast("Video upload cancelled", "error")
    }
  }

  // Thumbnail Upload Mutation
  const thumbnailMutation = useMutation({
    mutationFn: async ({ videoId, file }: { videoId: string; file: File }) => {
      setThumbnailProgress(0)
      const controller = new AbortController()
      thumbnailAbortRef.current = controller

      const res = await getVideoThumbnailSignatureApi(videoId)
      const cloudFormData = new FormData()
      cloudFormData.append("file", file)
      cloudFormData.append("api_key", res.apiKey || "")
      cloudFormData.append("signature", res.signature)
      cloudFormData.append("timestamp", res.timestamp.toString())
      cloudFormData.append("folder", res.folder)
      cloudFormData.append("public_id", res.public_id)
      cloudFormData.append("transformation", res.transformation)

      const cloudRes = await uploadThumbnailToCloudApi({
        uploadUrl: res.uploadUrl,
        formData: cloudFormData,
        signal: controller.signal,
        onProgress: (percent) => setThumbnailProgress(percent),
      })

      return confirmUploadThumbnailApi(videoId, {
        publicId: cloudRes.public_id,
        version: cloudRes.version,
        signature: cloudRes.signature,
        thumbnailUrl: cloudRes.secure_url,
      })
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["video", videoId], (old: any) => ({
        ...old,
        thumbnailUrl: data.thumbnailUrl || URL.createObjectURL(variables.file),
      }))
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
      showToast("Thumbnail updated successfully", "success")
    },
    onError: (err: any) => {
      if (
        axios.isCancel(err) ||
        err?.name === "CanceledError" ||
        err?.name === "AbortError"
      ) {
        return
      }
      showToast("Failed to upload thumbnail. Please try again.", "error")
    },
    onSettled: () => {
      thumbnailAbortRef.current = null
      setThumbnailProgress(null)
    },
  })

  // Media Upload Mutation
  const mediaMutation = useMutation({
    mutationFn: async ({ videoId, file }: { videoId: string; file: File }) => {
      setMediaProgress(0)
      const controller = new AbortController()
      mediaAbortRef.current = controller

      const res = await getVideoMediaSignatureApi(videoId)
      const cloudFormData = new FormData()
      cloudFormData.append("file", file)
      cloudFormData.append("api_key", res.apiKey || "")
      cloudFormData.append("signature", res.signature)
      cloudFormData.append("timestamp", res.timestamp.toString())
      cloudFormData.append("folder", res.folder)
      cloudFormData.append("public_id", res.public_id)
      cloudFormData.append("eager", res.eager)
      cloudFormData.append("eager_async", String(res.eager_async))
      cloudFormData.append("eager_notification_url", res.eager_notification_url)

      const cloudRes = await uploadVideoToCloudApi({
        uploadUrl: res.uploadUrl,
        formData: cloudFormData,
        signal: controller.signal,
        onProgress: (percent) => setMediaProgress(percent),
      })

      return confirmUploadVideoApi(videoId, {
        publicId: cloudRes.public_id,
        version: cloudRes.version,
        signature: cloudRes.signature,
        bytes: cloudRes.bytes,
        duration: cloudRes.duration,
      })
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["video", videoId], (old: any) => ({
        ...old,
        hlsUrl: data.hlsUrl || URL.createObjectURL(variables.file),
      }))
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
      showToast("Video source replaced successfully", "success")
    },
    onError: (err: any) => {
      if (
        axios.isCancel(err) ||
        err?.name === "CanceledError" ||
        err?.name === "AbortError"
      ) {
        return
      }
      showToast("Failed to upload video file. Please try again.", "error")
    },
    onSettled: () => {
      mediaAbortRef.current = null
      setMediaProgress(null)
    },
  })

  // Details Mutation
  const detailsMutation = useMutation({
    mutationFn: () =>
      updateVideoDetails(videoId!, {
        title,
        description,
        categoryId: categoryId || null,
        tags,
        ...(!video?.isPublished && {
          publishTime: publishTime ? new Date(publishTime).toISOString() : null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
      showToast("Video details saved", "success")
    },
    onError: () => showToast("Couldn't save changes.", "error"),
  })

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: () => updateVideoStatus(videoId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["video", videoId] })
      const previousVideo = queryClient.getQueryData(["video", videoId])
      queryClient.setQueryData(["video", videoId], (old: any) => ({
        ...old,
        isPublished: !old?.isPublished,
      }))
      return { previousVideo }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousVideo) {
        queryClient.setQueryData(["video", videoId], context.previousVideo)
      }
      showToast("Could not update visibility.", "error")
    },
    onSuccess: () => {
      showToast(
        !video?.isPublished ? "Set to Private" : "Published to Public",
        "success"
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading video workspace...
          </p>
        </div>
      </div>
    )
  }

  if (isError || !video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Video Not Found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This video might have been deleted or the access link is invalid.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Return to Studio
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Video Details
                </span>
                <span className="text-border">•</span>
                <span className="truncate text-xs text-muted-foreground">
                  ID: {videoId}
                </span>
              </div>
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
                {video.title || "Untitled Video"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="hidden sm:inline">Copy Link</span>
            </button>

            {video.isPublished && (
              <a
                href={`/videos/${videoId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">View Watch Page</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Details & Thumbnail */}
          <div className="space-y-6 lg:col-span-7">
            {/* Title & Description */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Basic Information
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Describe your video clearly for search and viewers
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <label
                      htmlFor="title"
                      className="font-medium text-foreground"
                    >
                      Title <span className="text-destructive">*</span>
                    </label>
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        title.length > 90
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {title.length}/100
                    </span>
                  </div>
                  <input
                    id="title"
                    type="text"
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a title that describes your video"
                    className="w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <label
                      htmlFor="desc"
                      className="font-medium text-foreground"
                    >
                      Description
                    </label>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {description.length} characters
                    </span>
                  </div>
                  <textarea
                    id="desc"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers what your video is about, add timestamps or links..."
                    className="w-full resize-y rounded-xl border border-input bg-muted/40 p-4 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>
            </div>

            {/* Category, Tags & Schedule */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Category, Tags & Schedule
                </h3>
                <p className="text-xs text-muted-foreground">
                  Help viewers discover your video
                </p>
              </div>

              <div className="mt-5 space-y-5">
                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    Category
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isCategoriesLoading}
                    className="w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {isCategoriesLoading
                        ? "Loading categories..."
                        : "Select a category"}
                    </option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label
                    htmlFor="tags"
                    className="mb-2 flex items-center justify-between text-xs font-medium text-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      Tags
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {tags.length}/{MAX_TAGS}
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-input bg-muted/40 p-2.5 focus-within:border-primary/60 focus-within:bg-card focus-within:ring-2 focus-within:ring-ring/20">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-primary/70 hover:text-primary transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      id="tags"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={handleAddTag}
                      placeholder={
                        tags.length === 0 ? "Add a tag and press Enter" : ""
                      }
                      disabled={tags.length >= MAX_TAGS}
                      className="min-w-[100px] flex-1 bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder-muted-foreground"
                    />
                  </div>
                </div>

                {/* Publish Time - only when not published */}
                {!video.isPublished && (
                  <div>
                    <label
                      htmlFor="publishTime"
                      className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Schedule publish time
                    </label>

                    <DateTimePicker
                      value={publishTime}
                      onChange={(val) => setPublishTime(val)}
                      minDate={new Date()}
                    />

                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Leave empty to keep the video unscheduled — you'll need to
                      publish it manually.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Manager */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Custom Thumbnail
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select or upload a picture that shows what is in your video
                  </p>
                </div>

                {/* Progress Badge with Cancel Button */}
                {thumbnailProgress !== null && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {thumbnailProgress}%
                    </span>
                    <button
                      onClick={handleCancelThumbnailUpload}
                      title="Cancel upload"
                      className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive transition hover:bg-destructive/20"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Thumbnail Preview Area */}
                <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt="Thumbnail preview"
                      className={cn(
                        "h-full w-full object-cover transition duration-300",
                        thumbnailProgress !== null
                          ? "scale-105 blur-[2px] opacity-60"
                          : "hover:scale-105"
                      )}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-xs">No thumbnail selected</span>
                    </div>
                  )}

                  {/* Thumbnail Overlay with Cancel Action */}
                  {thumbnailProgress !== null && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 p-4 text-center backdrop-blur-sm">
                      <p className="text-xs font-semibold text-foreground">
                        {thumbnailProgress < 100
                          ? `Uploading (${thumbnailProgress}%)`
                          : "Processing image..."}
                      </p>
                      <div className="mt-2.5 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${thumbnailProgress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      <button
                        onClick={handleCancelThumbnailUpload}
                        className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-destructive hover:text-destructive/80 transition"
                      >
                        <X className="h-3 w-3" /> Cancel upload
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Trigger Area */}
                <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-5 text-center transition hover:border-primary/60 hover:bg-primary/5">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={thumbnailMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && videoId) {
                        thumbnailMutation.mutate({ videoId, file })
                        e.target.value = ""
                      }
                    }}
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition group-hover:scale-110 group-hover:border-primary group-hover:text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-foreground">
                    {thumbnailMutation.isPending
                      ? "Uploading..."
                      : "Upload New Thumbnail"}
                  </span>
                  <span className="mt-1 text-[11px] text-muted-foreground">
                    16:9 ratio • PNG, JPG or WEBP up to 5MB
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Player & Visibility */}
          <div className="space-y-6 lg:col-span-5">
            {/* Video Player Card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Source Video
                </span>

                {mediaProgress !== null && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {mediaProgress}%
                    </span>
                    <button
                      onClick={handleCancelMediaUpload}
                      title="Cancel video upload"
                      className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive transition hover:bg-destructive/20"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Video Player Canvas */}
              <div className="relative aspect-video bg-black">
                {video.hlsUrl ? (
                  <video
                    src={video.hlsUrl}
                    controls
                    className={cn(
                      "h-full w-full object-contain transition",
                      mediaProgress !== null && "opacity-30 blur-sm"
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Film className="h-8 w-8" />
                    <span className="text-xs">No media file uploaded</span>
                  </div>
                )}

                {/* Video Upload Overlay with Cancel Action */}
                {mediaProgress !== null && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 text-center backdrop-blur-sm">
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-bold text-white">
                      {mediaProgress < 100
                        ? `Uploading Video: ${mediaProgress}%`
                        : "Encoding & processing HLS..."}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      {mediaProgress < 100
                        ? "Please keep this browser window open"
                        : "Generating streaming manifests..."}
                    </p>

                    <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/20">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${mediaProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>

                    <button
                      onClick={handleCancelMediaUpload}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/30"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel Upload
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Trigger / Action Bar */}
              <div className="border-t border-border bg-muted/30 p-4">
                {mediaProgress !== null ? (
                  <div className="space-y-2 py-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">
                        Uploading media...
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">
                          {mediaProgress}%
                        </span>
                        <button
                          onClick={handleCancelMediaUpload}
                          className="font-medium text-destructive hover:text-destructive/80 underline text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${mediaProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted">
                    <input
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      disabled={mediaMutation.isPending}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && videoId) {
                          mediaMutation.mutate({ videoId, file })
                          e.target.value = ""
                        }
                      }}
                    />
                    <Film className="h-3.5 w-3.5 text-primary" />
                    <span>Replace Video File</span>
                  </label>
                )}
              </div>
            </div>

            {/* Visibility / Publishing Control */}
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Visibility
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose who can watch this video right now
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => video.isPublished && statusMutation.mutate()}
                  disabled={statusMutation.isPending}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
                    !video.isPublished
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Private</span>
                </button>

                <button
                  type="button"
                  onClick={() => !video.isPublished && statusMutation.mutate()}
                  disabled={statusMutation.isPending}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
                    video.isPublished
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" />
                  )}
                  <span>Public</span>
                </button>
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {video.isPublished
                  ? "🌐 Public: Anyone on the platform can discover and watch this video."
                  : "🔒 Private: Only you can view this video in your studio."}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Dock */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 px-6 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                hasChanges ? "animate-pulse bg-amber-500" : "bg-emerald-500"
              )}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {hasChanges
                ? "You have unsaved changes"
                : "All changes up to date"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTitle(video.title || "")
                setDescription(video.description || "")
                setCategoryId(video.categoryId || "")
                setTags(video.tags?.map((t) => t.name) || [])
              }}
              disabled={!hasChanges || detailsMutation.isPending}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Discard
            </button>

            <motion.button
              whileHover={hasChanges ? { scale: 1.02 } : {}}
              whileTap={hasChanges ? { scale: 0.98 } : {}}
              onClick={() => detailsMutation.mutate()}
              disabled={!hasChanges || detailsMutation.isPending}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition",
                hasChanges
                  ? "bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              {detailsMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Changes
            </motion.button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={cn(
              "fixed bottom-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-md",
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
