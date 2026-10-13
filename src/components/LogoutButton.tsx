import { LogOut, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useLogout } from "../hooks/useLogout"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

interface LogoutButtonProps {
  variant?: "icon" | "sidebar" | "full"
  className?: string
  showLabel?: boolean
}

export const LogoutButton = ({
  variant = "icon",
  className,
  showLabel,
}: LogoutButtonProps) => {
  const { logoutSingleDeviceMutation } = useLogout()
  const isPending = logoutSingleDeviceMutation.isPending

  const handleLogout = () => {
    if (!isPending) logoutSingleDeviceMutation.mutate()
  }

  if (variant === "icon") {
    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          disabled={isPending}
          aria-label="Log out"
          title="Log out"
          className={cn(
            "rounded-full text-foreground/80 hover:bg-muted hover:text-foreground",
            className
          )}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </Button>
      </motion.div>
    )
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        aria-label="Log out"
        className={cn(
          "group relative flex h-11 w-full items-center rounded-xl px-3 text-sm font-medium outline-none transition-colors",
          "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
      >
        <div className="relative z-10 flex w-full items-center gap-3.5 justify-start">
          <span className="flex shrink-0 items-center justify-center">
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </span>
          <span className="truncate">
            {isPending ? "Logging out..." : (showLabel ?? true) ? "Log out" : ""}
          </span>
        </div>
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleLogout}
      disabled={isPending}
      className={cn("gap-2", className)}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {showLabel ?? true ? (isPending ? "Logging out..." : "Log out") : null}
    </Button>
  )
}
