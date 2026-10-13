import { cn } from "../../lib/utils"

export const StatusPill = ({ isPublished }: { isPublished: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
      isPublished
        ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-400"
        : "bg-muted text-muted-foreground ring-1 ring-border"
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        isPublished ? "bg-emerald-500" : "bg-muted-foreground"
      )}
    />
    {isPublished ? "Public" : "Draft"}
  </span>
)
