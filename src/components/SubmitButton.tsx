import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"

export function SubmitButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      type="submit"
      size="lg"
      className={cn(
        "w-full transition-transform duration-200 ease-out hover:scale-105 active:scale-95 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
