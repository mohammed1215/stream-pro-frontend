import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Download, Flag, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import axios from "axios"
import axiosInstance from "../../../lib/api"
import { cn } from "../../../lib/utils"
import { useToastCustom } from "../../../hooks/useToastCustom"
import { DropdownWrapper } from "../../../components/features/SaveDropdown"
import { PlaylistPopover } from "../../../components/features/PlaylistPopover"

export function MoreOptionsDropdown({
  isOpen,
  videoId,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  videoId?: string
}) {
  const { error } = useToastCustom()
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)

  const handleSaveFile = (blobData: Blob, fileName = "video.mp4") => {
    const url = window.URL.createObjectURL(blobData)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      setDownloadProgress(0)
      const response = await axiosInstance.get(`/api/v1/downloads/${id}`, {
        skipErrorToast: true,
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setDownloadProgress(percent)
          }
        },
      })
      return response.data
    },
    onSuccess: (data) => {
      handleSaveFile(data, `video-${videoId}.mp4`)
    },
    onError: async (err: unknown) => {
      try {
        const data =
          axios.isAxiosError(err) ? err.response?.data : undefined
        const rawText =
          data instanceof Blob
            ? await data.text()
            : (data as { message?: string } | undefined)?.message ?? "{}"

        const parsed = JSON.parse(rawText)
        const rawMessage = parsed?.message ?? rawText

        const cleaned = rawMessage
          .replace("Cloudinary fetch failed (404): ", "")
          .split("-")[0]
          .trim()

        error(cleaned)
      } catch {
        error("Failed to download video")
      }
    },
    onSettled: () => {
      setDownloadProgress(null)
    },
  })

  const handleDownloadClick = () => {
    if (videoId && !downloadMutation.isPending) {
      downloadMutation.mutate(videoId)
    }
  }

  return (
    <DropdownWrapper isOpen={isOpen} onClose={onClose}>
      <div className="p-1 min-w-45 space-y-0.5">
        {videoId && (
          <div className="hidden sm:block">
            <PlaylistPopover videoId={videoId} />
          </div>
        )}

        {/* DOWNLOAD ITEM */}
        <div className="relative">
          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={downloadMutation.isPending}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            ) : (
              <Download className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="flex-1 text-left">
              {downloadMutation.isPending
                ? downloadProgress !== null
                  ? `Downloading... ${downloadProgress}%`
                  : "Downloading..."
                : "Download"}
            </span>
          </button>

          {/* Progress bar */}
          {downloadMutation.isPending && (
            <div className="px-3 pb-1.5">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full bg-primary transition-all duration-200",
                    downloadProgress === null && "animate-pulse w-full"
                  )}
                  style={
                    downloadProgress !== null
                      ? { width: `${downloadProgress}%` }
                      : undefined
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="my-1 border-t border-border/60" />

        {/* REPORT ITEM */}
        <button
          type="button"
          onClick={() => {
            toast.info("Report feature coming soon.")
            onClose()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <Flag className="h-4 w-4" />
          <span>Report</span>
        </button>
      </div>
    </DropdownWrapper>
  )
}
