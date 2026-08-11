import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

export const GhostButton = ({
  className,
  ...props
}: {
  className?: string
  [key: string]: any
}) => {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg border border-transparent",
        "transition-all duration-200",
        "hover:border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2",
        "active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-50",
        "dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-50",
        className
      )}
      {...props}
    />
  )
}
