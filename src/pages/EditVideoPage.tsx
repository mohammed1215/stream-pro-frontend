import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  Upload,
  Film,
  Image as ImageIcon,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import {
  updateVideoThumbnail,
  videoDetails,
  updateVideoDetails,
  uploadVideoMedia,
  updateVideoStatus,
  type VideoDetailResponse,
} from "../lib/video"

export const StudioEditVideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Local state for editable form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  // Fetch initial video data
  const {
    data: video,
    isLoading,
    isError,
  } = useQuery<VideoDetailResponse, Error>({
    queryKey: ["video", videoId],
    queryFn: () => videoDetails(videoId!),
    enabled: !!videoId,
  })

  // Populate form when data loads
  useEffect(() => {
    if (video) {
      setTitle(video.title)
      setDescription(video.description || "")
    }
  }, [video])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Mutations
  const thumbnailMutation = useMutation({
    mutationFn: (file: File) => updateVideoThumbnail(videoId!, file),
    // Use 'variables' to access the file argument in the success callback
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["video", videoId], (old: any) => ({
        ...old,
        thumbnailUrl: data.thumbnailUrl || URL.createObjectURL(variables),
      }))
      showToast("Thumbnail updated successfully!", "success")
    },
    onError: () => showToast("Failed to upload thumbnail.", "error"),
  })

  const mediaMutation = useMutation({
    mutationFn: (file: File) => uploadVideoMedia(videoId!, file),
    // Use 'variables' to access the file argument in the success callback
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["video", videoId], (old: any) => ({
        ...old,
        videoUrl: data.videoUrl || URL.createObjectURL(variables),
      }))
      showToast("Video file updated successfully!", "success")
    },
    onError: () => showToast("Failed to upload video file.", "error"),
  })

  const detailsMutation = useMutation({
    mutationFn: () => updateVideoDetails(videoId!, { title, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
      showToast("Details saved successfully!", "success")
      setTimeout(() => navigate(-1), 1000) // Go back after saving
    },
    onError: () => showToast("Failed to save details.", "error"),
  })

  // 3. Status Mutation (Publish/Unpublish) with Optimistic UI
  const statusMutation = useMutation({
    mutationFn: () => updateVideoStatus(videoId!),
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["video", videoId] })

      // Snapshot the previous value
      const previousVideo = queryClient.getQueryData(["video", videoId])

      // Optimistically update to the new value
      queryClient.setQueryData(["video", videoId], (old: any) => ({
        ...old,
        isPublished: !old?.isPublished,
      }))

      return { previousVideo }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back to the snapshot value
      if (context?.previousVideo) {
        queryClient.setQueryData(["video", videoId], context.previousVideo)
      }
      showToast("Failed to update visibility status.", "error")
    },
    onSuccess: () => {
      showToast(
        `Video ${
          !video?.isPublished ? "published" : "unpublished"
        } successfully!`,
        "success"
      )
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["video", videoId] })
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto animate-pulse space-y-8">
          <div className="h-10 w-64 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="aspect-video bg-slate-200 rounded-2xl" />
              <div className="aspect-video bg-slate-200 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded-lg" />
              <div className="h-32 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !video) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900">
            Failed to load video
          </h2>
          <p className="text-slate-500 mt-1">
            We couldn't find this video or it was deleted.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Video details</h1>
            <p className="text-xs text-slate-500">
              Manage metadata and media for this video
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Discard
          </button>
          <button
            onClick={() => detailsMutation.mutate()}
            disabled={detailsMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {detailsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save changes
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media & Thumbnail */}
        <div className="lg:col-span-2 space-y-8">
          {/* Video Media Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Video File
              </h2>
              {mediaMutation.isPending && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                </span>
              )}
            </div>

            {mediaMutation.isPending ? (
              <div className="aspect-video w-full rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-3">
                <div className="relative h-2 w-3/4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-indigo-500 animate-pulse origin-left"
                    style={{ transform: "scaleX(0.6)" }}
                  />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Processing video...
                </p>
              </div>
            ) : video.videoUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black group-hover:ring-2 ring-indigo-500 transition-all">
                {/* Video is NO LONGER wrapped in a label */}
                <video
                  src={video.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />

                {/* The overlay is now the label. Removed pointer-events-none to catch clicks */}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        mediaMutation.mutate(file)
                        e.target.value = "" // Crucial: resets input so the same file can be re-uploaded
                      }
                    }}
                  />
                  <span className="text-white font-semibold bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Replace Video File
                  </span>
                </label>
              </div>
            ) : (
              // Empty state remains a label for easy initial upload
              <label className="relative block group cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      mediaMutation.mutate(file)
                      e.target.value = ""
                    }
                  }}
                />
                <div className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                    <Film className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Click to upload video
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    MP4, WebM or MOV (Max 2GB)
                  </p>
                </div>
              </label>
            )}
            {mediaMutation.isError && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" /> Failed to upload video.
                Please try again.
              </div>
            )}
          </section>

          {/* Thumbnail Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Thumbnail
              </h2>
              {thumbnailMutation.isPending && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                </span>
              )}
            </div>

            {thumbnailMutation.isPending ? (
              <div className="aspect-video w-full rounded-xl bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-200 group-hover:ring-2 ring-indigo-500 transition-all">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                {/* The overlay acts as the label, preventing weird click behaviors on the image */}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        thumbnailMutation.mutate(file)
                        e.target.value = ""
                      }
                    }}
                  />
                  <span className="text-white font-semibold bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />{" "}
                    {video.thumbnailUrl
                      ? "Change Thumbnail"
                      : "Upload Thumbnail"}
                  </span>
                </label>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Recommended size: 1280x720 pixels (16:9 aspect ratio)
            </p>
          </section>
        </div>

        {/* Right Column: Details Form */}
        <div className="lg:col-span-1">
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Video Details
            </h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title..."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="desc"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="desc"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video..."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none shadow-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Visibility
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {video.isPublished
                          ? "Visible to everyone"
                          : "Only visible to you"}
                      </p>
                    </div>
                    {statusMutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate()}
                    disabled={statusMutation.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      video.isPublished ? "bg-indigo-600" : "bg-slate-300"
                    } ${
                      statusMutation.isPending
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        video.isPublished ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
