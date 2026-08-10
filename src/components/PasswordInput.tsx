import { Eye, EyeOff, LockKeyhole } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group"
import { useState } from "react"
import { InputErrorMessage } from "./InputErrorMessage"
import { cn } from "../lib/utils"

export function PasswordInput({
  placeholder = "Password",
  message,
  containerClassName,
  className,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  message?: string
  containerClassName?: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        Password
      </label>
      <InputGroup
        className={cn("overflow-hidden rounded-lg py-6", containerClassName)}
        {...props}
      >
        <InputGroupInput
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className={cn("min-w-0 flex-1", className)}
        />

        <InputGroupAddon align="inline-start" className="text-muted-foreground">
          <LockKeyhole className="size-5" aria-hidden />
        </InputGroupAddon>

        <InputGroupButton
          type="button"
          size="icon-xs"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="mr-1.5"
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </InputGroupButton>
      </InputGroup>
      <InputErrorMessage message={message} />
    </div>
  )
}
