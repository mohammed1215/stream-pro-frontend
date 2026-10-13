import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"

export const PaginationControls = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  disabled,
}: {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  disabled?: boolean
}) => {
  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-4">
      <div className="text-xs text-muted-foreground">
        Page <span className="font-bold text-foreground">{currentPage}</span> of{" "}
        <span className="font-bold text-foreground">{totalPages || 1}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-lg"
          disabled={!hasPrevPage || disabled}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-lg"
          disabled={!hasNextPage || disabled}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
