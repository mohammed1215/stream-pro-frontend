import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import {
  Loader2,
  Upload,
  ImageIcon,
  Save,
  AlertCircle,
  CheckCircle2,
  X,
  Camera,
  UserCircle2,
} from "lucide-react"
import axiosInstance from "../lib/api"
import { uploadThumbnailToCloudApi } from "../lib/video"
import { cn } from "../lib/utils"
import {
  fetchChannelData,
  fetchOwnerChannelData,
  updateChannelAvatar,
  updateChannelBanner,
} from "../lib/channel"

// ============================================================
// TODO(api): replace these with your real endpoints/DTOs once
// the backend is ready. Shapes are guesses based on the existing
// FetchChannelDataResponse / video-thumbnail signature pattern.
// ============================================================

// interface OwnerChannelData {
//   channelId: string
//   title: string
//   description: string
//   thumbnailUrl: string | null // banner
//   channelImageUrl: string | null // avatar
// }

// const getOwnerChannelData = async (): Promise<OwnerChannelData> => {
//   const res = await axiosInstance.get<OwnerChannelData>("/api/v1/owner/channel")
//   return res.data
// }

// const updateChannelDetails = async (payload: {
//   title: string
//   description: string
// }) => {
//   // TODO(api): PATCH /api/v1/owner/channel
//   const res = await axiosInstance.patch("/api/v1/owner/channel", payload)
//   return res.data
// }

interface CloudSignature {
  uploadUrl: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  public_id: string
  transformation?: string
}

// const getChannelAvatarSignatureApi = async (): Promise<CloudSignature> => {
//   // TODO(api): PATCH /api/v1/owner/channel/avatar/signature
//   const res = await axiosInstance.patch<CloudSignature>(
//     "/api/v1/owner/channel/avatar/signature"
//   )
//   return res.data
// }

// const confirmChannelAvatarUpload = async (payload: {
//   publicId: string
//   version: number
//   signature: string
//   channelImageUrl: string
// }) => {
//   // TODO(api): POST /api/v1/owner/channel/avatar-upload-completed
//   const res = await axiosInstance.post(
//     "/api/v1/owner/channel/avatar-upload-completed",
//     payload
//   )
//   return res.data
// }

// const getChannelBannerSignatureApi = async (): Promise<CloudSignature> => {
//   // TODO(api): PATCH /api/v1/owner/channel/banner/signature
//   const res = await axiosInstance.patch<CloudSignature>(
//     "/api/v1/owner/channel/banner/signature"
//   )
//   return res.data
// }

// const confirmChannelBannerUpload = async (payload: {
//   publicId: string
//   version: number
//   signature: string
//   thumbnailUrl: string
// }) => {
//   // TODO(api): POST /api/v1/owner/channel/banner-upload-completed
//   const res = await axiosInstance.post(
//     "/api/v1/owner/channel/banner-upload-completed",
//     payload
//   )
//   return res.data
// }

// ============================================================
// Component
// ============================================================

export const StudioChannelCustomizationPage = () => {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  const [avatarProgress, setAvatarProgress] = useState<number | null>(null)
  const [bannerProgress, setBannerProgress] = useState<number | null>(null)
  const avatarAbortRef = useRef<AbortController | null>(null)
  const bannerAbortRef = useRef<AbortController | null>(null)

  const {
    data: channel,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["owner-channel"],
    queryFn: ({ signal }) => fetchOwnerChannelData(signal),
  })

  useEffect(() => {
    if (channel) {
      setTitle(channel.title || "")
      setDescription(channel.description || "")
    }
  }, [channel])

  useEffect(() => {
    return () => {
      avatarAbortRef.current?.abort()
      bannerAbortRef.current?.abort()
    }
  }, [])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const hasChanges =
    channel &&
    (title !== channel.title || description !== (channel.description || ""))

  //   // --- Details mutation ---
  //   const detailsMutation = useMutation({
  //     mutationFn: () => updateChannelDetails({ title, description }),
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ["owner-channel"] })
  //       showToast("Channel details saved", "success")
  //     },
  //     onError: () => showToast("Couldn't save changes.", "error"),
  //   })

  // --- Avatar mutation ---
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      setAvatarProgress(0)
      const controller = new AbortController()
      avatarAbortRef.current = controller
      return updateChannelAvatar(
        { avatar: file },
        (progressEvent) => {
          if (progressEvent?.progress) {
            setAvatarProgress(progressEvent.progress * 100)
          }
        },
        controller.signal
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-channel"] })
      showToast("Avatar updated successfully", "success")
    },
    onError: (err: any) => {
      if (axios.isCancel(err) || err?.name === "CanceledError") return
      showToast("Failed to upload avatar. Please try again.", "error")
    },
    onSettled: () => {
      avatarAbortRef.current = null
      setAvatarProgress(null)
    },
  })

  // --- Banner mutation ---
  const bannerMutation = useMutation({
    mutationFn: async (file: File) => {
      setBannerProgress(0)
      const controller = new AbortController()
      bannerAbortRef.current = controller

      return updateChannelBanner(
        { thumbnail: file },
        (progressEvent) => {
          if (progressEvent?.progress) {
            setBannerProgress(progressEvent.progress * 100)
          }
        },
        controller.signal
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-channel"] })
      showToast("Banner updated successfully", "success")
    },
    onError: (err: any) => {
      if (axios.isCancel(err) || err?.name === "CanceledError") return
      showToast("Failed to upload banner. Please try again.", "error")
    },
    onSettled: () => {
      bannerAbortRef.current = null
      setBannerProgress(null)
    },
  })

  const handleCancelAvatarUpload = () => {
    avatarAbortRef.current?.abort()
    avatarAbortRef.current = null
    setAvatarProgress(null)
    showToast("Avatar upload cancelled", "error")
  }

  const handleCancelBannerUpload = () => {
    bannerAbortRef.current?.abort()
    bannerAbortRef.current = null
    setBannerProgress(null)
    showToast("Banner upload cancelled", "error")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading channel settings...
          </p>
        </div>
      </div>
    )
  }

  if (isError || !channel) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Couldn't load channel
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong while fetching your channel settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Studio</span>
            <span>/</span>
            <span>Customize Channel</span>
          </div>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-foreground">
            Channel Customization
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* Banner */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Channel Banner
                </h3>
                <p className="text-xs text-muted-foreground">
                  Shown across the top of your channel page
                </p>
              </div>
              {bannerProgress !== null && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {bannerProgress}%
                  </span>
                  <button
                    onClick={handleCancelBannerUpload}
                    title="Cancel upload"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive transition hover:bg-destructive/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-border bg-muted">
                {channel.thumbnailUrl ? (
                  <img
                    src={channel.thumbnailUrl}
                    alt="Channel banner"
                    className={cn(
                      "h-full w-full object-cover transition duration-300",
                      bannerProgress !== null &&
                        "scale-105 opacity-60 blur-[2px]"
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">No banner set</span>
                  </div>
                )}

                {bannerProgress !== null && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 p-4 text-center backdrop-blur-sm">
                    <p className="text-xs font-semibold text-foreground">
                      {bannerProgress < 100
                        ? `Uploading (${bannerProgress}%)`
                        : "Processing image..."}
                    </p>
                    <div className="mt-2.5 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${bannerProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <button
                      onClick={handleCancelBannerUpload}
                      className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-destructive transition hover:text-destructive/80"
                    >
                      <X className="h-3 w-3" /> Cancel upload
                    </button>
                  </div>
                )}

                <label className="absolute bottom-3 right-3 z-20 flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition hover:border-primary/40 hover:bg-card">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={bannerMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        bannerMutation.mutate(file)
                        e.target.value = ""
                      }
                    }}
                  />
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  {bannerMutation.isPending ? "Uploading..." : "Change Banner"}
                </label>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Recommended: wide format (e.g. 2048×512) • PNG, JPG or WEBP up
                to 5MB
              </p>
            </div>
          </div>

          {/* Avatar + Info */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Avatar */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  Channel Avatar
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your channel's profile picture
                </p>

                <div className="mt-5 flex flex-col items-center gap-4">
                  <div className="group relative h-28 w-28">
                    <div
                      className={cn(
                        "h-28 w-28 overflow-hidden rounded-full border border-border bg-muted shadow-sm transition",
                        avatarProgress !== null && "opacity-50 blur-[1px]"
                      )}
                    >
                      {channel.channelImageUrl ? (
                        <img
                          src={channel.channelImageUrl}
                          alt="Channel avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <UserCircle2 className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    {avatarProgress === null && (
                      <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={avatarMutation.isPending}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              avatarMutation.mutate(file)
                              e.target.value = ""
                            }
                          }}
                        />
                        <Camera className="h-4 w-4" />
                      </label>
                    )}

                    {avatarProgress !== null && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  {avatarProgress !== null && (
                    <div className="w-full space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-muted-foreground">
                          {avatarProgress}%
                        </span>
                        <button
                          onClick={handleCancelAvatarUpload}
                          className="font-semibold text-destructive hover:text-destructive/80"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${avatarProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-center text-[11px] text-muted-foreground">
                    Square image recommended • PNG, JPG or WEBP up to 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Info Form */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  Basic Info
                </h3>
                <p className="text-xs text-muted-foreground">
                  This is how your channel appears to viewers
                </p>

                <div className="mt-5 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <label
                        htmlFor="channel-title"
                        className="font-medium text-foreground"
                      >
                        Channel Name <span className="text-destructive">*</span>
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
                      id="channel-title"
                      type="text"
                      maxLength={100}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Add a name for your channel"
                      className="w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <label
                        htmlFor="channel-desc"
                        className="font-medium text-foreground"
                      >
                        Description
                      </label>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {description.length} characters
                      </span>
                    </div>
                    <textarea
                      id="channel-desc"
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell viewers about your channel..."
                      className="w-full resize-y rounded-xl border border-input bg-muted/40 p-4 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Save Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 px-6 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
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
                setTitle(channel.title || "")
                setDescription(channel.description || "")
              }}
              //   disabled={!hasChanges || detailsMutation.isPending}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Discard
            </button>

            <motion.button
              whileHover={hasChanges ? { scale: 1.02 } : {}}
              whileTap={hasChanges ? { scale: 0.98 } : {}}
              //   onClick={() => detailsMutation.mutate()}
              //   disabled={!hasChanges || detailsMutation.isPending}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition",
                hasChanges
                  ? "bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              {/* {detailsMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )} */}
              Save Changes
            </motion.button>
          </div>
        </div>
      </div>

      {/* Toast */}
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
