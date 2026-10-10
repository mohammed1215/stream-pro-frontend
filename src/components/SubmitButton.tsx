import { Loader2 } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean
}

export function SubmitButton({
  className,
  children,
  isLoading = false,
  disabled,
  ...props
}: SubmitButtonProps) {
  const isDisabled = disabled ?? isLoading
  return (
    <Button
      type="submit"
      size="lg"
      disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(
        "w-full transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:hover:scale-100",
        isLoading && "opacity-90",
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}
