import { motion } from "framer-motion"
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react"
import { cn } from "../../lib/utils"

export const ThumbnailManager = ({
  thumbnailUrl,
  thumbnailProgress,
  isUploading,
  onSelectFile,
  onCancelUpload,
}: {
  thumbnailUrl?: string | null
  thumbnailProgress: number | null
  isUploading: boolean
  onSelectFile: (file: File) => void
  onCancelUpload: () => void
}) => (
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
            onClick={onCancelUpload}
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
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
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
              onClick={onCancelUpload}
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
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              onSelectFile(file)
              e.target.value = ""
            }
          }}
        />
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition group-hover:scale-110 group-hover:border-primary group-hover:text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <span className="mt-3 text-xs font-semibold text-foreground">
          {isUploading ? "Uploading..." : "Upload New Thumbnail"}
        </span>
        <span className="mt-1 text-[11px] text-muted-foreground">
          16:9 ratio • PNG, JPG or WEBP up to 5MB
        </span>
      </label>
    </div>
  </div>
)
