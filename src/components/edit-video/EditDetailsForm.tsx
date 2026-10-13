import { Clock, FolderOpen, Sparkles, Tag, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { DateTimePicker } from "../DateTimePicker"
import { MAX_TAGS } from "./editVideoUtils"

export interface EditCategory {
  id: string
  name: string
}

export const EditDetailsForm = ({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  categories,
  isCategoriesLoading,
  categoryId,
  onCategoryChange,
  tags,
  tagInput,
  onTagInputChange,
  onTagKeyDown,
  onTagBlur,
  onRemoveTag,
  publishTime,
  onPublishTimeChange,
  isPublished,
}: {
  title: string
  onTitleChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  categories?: EditCategory[]
  isCategoriesLoading: boolean
  categoryId: string
  onCategoryChange: (v: string) => void
  tags: string[]
  tagInput: string
  onTagInputChange: (v: string) => void
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onTagBlur: () => void
  onRemoveTag: (tag: string) => void
  publishTime: string
  onPublishTimeChange: (v: string) => void
  isPublished: boolean
}) => (
  <>
    {/* Title & Description */}
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Basic Information
          </h3>
          <p className="text-xs text-muted-foreground">
            Describe your video clearly for search and viewers
          </p>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <label htmlFor="title" className="font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <span
              className={cn(
                "font-mono text-[11px]",
                title.length > 90 ? "text-amber-500" : "text-muted-foreground"
              )}
            >
              {title.length}/100
            </span>
          </div>
          <input
            id="title"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Add a title that describes your video"
            className="w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <label htmlFor="desc" className="font-medium text-foreground">
              Description
            </label>
            <span className="font-mono text-[11px] text-muted-foreground">
              {description.length} characters
            </span>
          </div>
          <textarea
            id="desc"
            rows={6}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Tell viewers what your video is about, add timestamps or links..."
            className="w-full resize-y rounded-xl border border-input bg-muted/40 p-4 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>
    </div>

    {/* Category, Tags & Schedule */}
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="border-b border-border pb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Category, Tags & Schedule
        </h3>
        <p className="text-xs text-muted-foreground">
          Help viewers discover your video
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={isCategoriesLoading}
            className="w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {isCategoriesLoading
                ? "Loading categories..."
                : "Select a category"}
            </option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags"
            className="mb-2 flex items-center justify-between text-xs font-medium text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              Tags
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {tags.length}/{MAX_TAGS}
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-input bg-muted/40 p-2.5 focus-within:border-primary/60 focus-within:bg-card focus-within:ring-2 focus-within:ring-ring/20">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => onTagInputChange(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={onTagBlur}
              placeholder={tags.length === 0 ? "Add a tag and press Enter" : ""}
              disabled={tags.length >= MAX_TAGS}
              className="min-w-[100px] flex-1 bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Publish Time - only when not published */}
        {!isPublished && (
          <div>
            <label
              htmlFor="publishTime"
              className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Schedule publish time
            </label>

            <DateTimePicker
              value={publishTime}
              onChange={(val) => onPublishTimeChange(val)}
              minDate={new Date()}
            />

            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Leave empty to keep the video unscheduled — you'll need to
              publish it manually.
            </p>
          </div>
        )}
      </div>
    </div>
  </>
)
