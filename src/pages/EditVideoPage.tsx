import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
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
import { cn } from "../lib/utils"
import { EditVideoHeader } from "../components/edit-video/EditVideoHeader"
import { EditDetailsForm } from "../components/edit-video/EditDetailsForm"
import { ThumbnailManager } from "../components/edit-video/ThumbnailManager"
import { EditMediaPanel } from "../components/edit-video/EditMediaPanel"
import { VisibilityControl } from "../components/edit-video/VisibilityControl"
import { EditBottomDock } from "../components/edit-video/EditBottomDock"
import {
  MAX_TAGS,
  normalizeTagList,
} from "../components/edit-video/editVideoUtils"

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
      JSON.stringify(tags) !== JSON.stringify(normalizeTagList(video.tags)) ||
      (!video.isPublished &&
        publishTime !==
          (video.publishTime ? toDatetimeLocalValue(video.publishTime) : "")))

  // Initialize the form from the fetched video. Done during render (not in
  // an effect) per the React docs pattern for adjusting state when props
  // change. Keyed on the query object identity, same as the previous effect.
  const [lastVideo, setLastVideo] = useState<VideoDetailResponse | null>(null)
  if (video && video !== lastVideo) {
    setLastVideo(video)
    setTitle(video.title || "")
    setDescription(video.description || "")
    setCategoryId(video.categoryId || "")
    setTags(normalizeTagList(video.tags))
    setPublishTime(
      video.publishTime ? toDatetimeLocalValue(video.publishTime) : ""
    )
  }

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
      queryClient.setQueryData(
        ["video", videoId],
        (old: VideoDetailResponse | undefined) => ({
          ...old,
          thumbnailUrl:
            data.thumbnailUrl || URL.createObjectURL(variables.file),
        })
      )
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
      showToast("Thumbnail updated successfully", "success")
    },
    onError: (err: unknown) => {
      if (axios.isCancel(err)) return
      if (err instanceof Error && err.name === "CanceledError") return
      if (err instanceof Error && err.name === "AbortError") return
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
      queryClient.setQueryData(
        ["video", videoId],
        (old: VideoDetailResponse | undefined) => ({
          ...old,
          hlsUrl: data.hlsUrl || URL.createObjectURL(variables.file),
        })
      )
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
      showToast("Video source replaced successfully", "success")
    },
    onError: (err: unknown) => {
      if (axios.isCancel(err)) return
      if (err instanceof Error && err.name === "CanceledError") return
      if (err instanceof Error && err.name === "AbortError") return
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
      queryClient.setQueryData(
        ["video", videoId],
        (old: VideoDetailResponse | undefined) => ({
          ...old,
          isPublished: !old?.isPublished,
        })
      )
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

  const handleDiscard = () => {
    setTitle(video.title || "")
    setDescription(video.description || "")
    setCategoryId(video.categoryId || "")
    setTags(normalizeTagList(video.tags))
  }

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground selection:bg-primary/20 selection:text-primary">
      <EditVideoHeader
        videoId={videoId}
        title={video.title}
        isPublished={video.isPublished}
        copied={copied}
        onBack={() => navigate(-1)}
        onCopyLink={handleCopyLink}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Details & Thumbnail */}
          <div className="space-y-6 lg:col-span-7">
            <EditDetailsForm
              title={title}
              onTitleChange={setTitle}
              description={description}
              onDescriptionChange={setDescription}
              categories={categories}
              isCategoriesLoading={isCategoriesLoading}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              tags={tags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              onTagKeyDown={handleTagKeyDown}
              onTagBlur={handleAddTag}
              onRemoveTag={handleRemoveTag}
              publishTime={publishTime}
              onPublishTimeChange={setPublishTime}
              isPublished={video.isPublished}
            />

            <ThumbnailManager
              thumbnailUrl={video.thumbnailUrl}
              thumbnailProgress={thumbnailProgress}
              isUploading={thumbnailMutation.isPending}
              onSelectFile={(file) =>
                videoId && thumbnailMutation.mutate({ videoId, file })
              }
              onCancelUpload={handleCancelThumbnailUpload}
            />
          </div>

          {/* Right Column: Player & Visibility */}
          <div className="space-y-6 lg:col-span-5">
            <EditMediaPanel
              hlsUrl={video.hlsUrl}
              mediaProgress={mediaProgress}
              isUploading={mediaMutation.isPending}
              onSelectFile={(file) =>
                videoId && mediaMutation.mutate({ videoId, file })
              }
              onCancelUpload={handleCancelMediaUpload}
            />

            <VisibilityControl
              isPublished={video.isPublished}
              isPending={statusMutation.isPending}
              onToggle={() => statusMutation.mutate()}
            />
          </div>
        </div>
      </main>

      <EditBottomDock
        hasChanges={Boolean(hasChanges)}
        isSaving={detailsMutation.isPending}
        onDiscard={handleDiscard}
        onSave={() => detailsMutation.mutate()}
      />

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
