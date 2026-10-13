import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react"

export const EditVideoHeader = ({
  videoId,
  title,
  isPublished,
  copied,
  onBack,
  onCopyLink,
}: {
  videoId?: string
  title: string
  isPublished: boolean
  copied: boolean
  onBack: () => void
  onCopyLink: () => void
}) => (
  <header className="sticky top-0 z-30 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-md">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={onBack}
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
            {title || "Untitled Video"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onCopyLink}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="hidden sm:inline">Copy Link</span>
        </button>

        {isPublished && (
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
)
