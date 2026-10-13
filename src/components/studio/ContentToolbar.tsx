import { LayoutGrid, Search, Table as TableIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import type { SortOption, StatusFilter, ViewMode } from "./contentFilters"

export const ContentToolbar = ({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  totalCount,
  viewMode,
  onViewModeChange,
}: {
  query: string
  onQueryChange: (v: string) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  sort: SortOption
  onSortChange: (v: SortOption) => void
  totalCount: number
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
}) => (
  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
    {/* Search Input */}
    <div className="relative min-w-[220px] flex-1">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Filter your videos by title..."
        className="w-full rounded-xl border border-input bg-muted/40 py-2 pl-9 pr-4 text-xs font-medium text-foreground placeholder-muted-foreground outline-none transition focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
      />
    </div>

    {/* Status Filter */}
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className="rounded-xl border border-input bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        <option value="ALL">All Visibility</option>
        <option value="PUBLISHED">Public</option>
        <option value="UNPUBLISHED">Draft / Private</option>
      </select>

      {/* Sort Filter */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="rounded-xl border border-input bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        <option value="NEWEST">Date: Newest</option>
        <option value="OLDEST">Date: Oldest</option>
        <option value="MOST_VIEWED">Most Views</option>
      </select>
    </div>

    {/* View Mode Toggle */}
    <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
      <button
        onClick={() => onViewModeChange("table")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          viewMode === "table"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Table view"
      >
        <TableIcon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          viewMode === "grid"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>

    {/* Video Counter */}
    <div className="ml-auto hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
      <span className="inline-flex h-6 items-center justify-center rounded-lg bg-secondary px-2 font-mono text-xs font-bold text-foreground">
        {totalCount}
      </span>
      <span>videos</span>
    </div>
  </div>
)
