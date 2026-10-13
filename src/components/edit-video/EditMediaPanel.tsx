import { motion } from "framer-motion"
import { Film, Loader2, X } from "lucide-react"
import { cn } from "../../lib/utils"

export const EditMediaPanel = ({
  hlsUrl,
  mediaProgress,
  isUploading,
  onSelectFile,
  onCancelUpload,
}: {
  hlsUrl?: string | null
  mediaProgress: number | null
  isUploading: boolean
  onSelectFile: (file: File) => void
  onCancelUpload: () => void
}) => (
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
            onClick={onCancelUpload}
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
      {hlsUrl ? (
        <video
          src={hlsUrl}
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
            onClick={onCancelUpload}
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
                onClick={onCancelUpload}
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
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onSelectFile(file)
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
)
