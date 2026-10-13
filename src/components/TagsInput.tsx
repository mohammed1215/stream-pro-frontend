import { useState, type Dispatch, type SetStateAction } from "react"
import { Plus, X } from "lucide-react"

export function TagsInput({
  tags,
  setTags,
}: {
  tags: string[]
  setTags: Dispatch<SetStateAction<string[]>>
}) {
  const [tagInput, setTagInput] = useState("")

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add tags (press Enter)..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:bg-background"
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={!tagInput.trim()}
          className="inline-flex h-9.5 items-center justify-center gap-1 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-accent0/10 px-3 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-primary/90/15 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                className="group -mr-1 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary/20 dark:hover:bg-cyan-300/20"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3 text-accent-foreground/70 transition-colors group-hover:text-cyan-900 dark:text-cyan-300/70 dark:group-hover:text-cyan-100" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
