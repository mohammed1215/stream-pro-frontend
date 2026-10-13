import { Globe, Loader2, Lock } from "lucide-react"
import { cn } from "../../lib/utils"

export const VisibilityControl = ({
  isPublished,
  isPending,
  onToggle,
}: {
  isPublished: boolean
  isPending: boolean
  onToggle: () => void
}) => (
  <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div>
      <h3 className="text-sm font-semibold text-foreground">Visibility</h3>
      <p className="text-xs text-muted-foreground">
        Choose who can watch this video right now
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1">
      <button
        type="button"
        onClick={() => isPublished && onToggle()}
        disabled={isPending}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
          !isPublished
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Private</span>
      </button>

      <button
        type="button"
        onClick={() => !isPublished && onToggle()}
        disabled={isPending}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
          isPublished
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
        <span>Public</span>
      </button>
    </div>

    <p className="text-[11px] leading-relaxed text-muted-foreground">
      {isPublished
        ? "🌐 Public: Anyone on the platform can discover and watch this video."
        : "🔒 Private: Only you can view this video in your studio."}
    </p>
  </div>
)
