import { motion } from "framer-motion"
import { Loader2, Save } from "lucide-react"
import { cn } from "../../lib/utils"

export const EditBottomDock = ({
  hasChanges,
  isSaving,
  onDiscard,
  onSave,
}: {
  hasChanges: boolean
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
}) => (
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
          {hasChanges ? "You have unsaved changes" : "All changes up to date"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDiscard}
          disabled={!hasChanges || isSaving}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Discard
        </button>

        <motion.button
          whileHover={hasChanges ? { scale: 1.02 } : {}}
          whileTap={hasChanges ? { scale: 0.98 } : {}}
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition",
            hasChanges
              ? "bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Changes
        </motion.button>
      </div>
    </div>
  </div>
)
