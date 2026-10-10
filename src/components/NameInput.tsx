import { User } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group"
import { InputErrorMessage } from "./InputErrorMessage"
import { cn } from "../lib/utils"
import React from "react"

type NameInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  message?: string
  containerClassName?: string
}

export const NameInput = ({
  message,
  containerClassName,
  className,
  name,
  id,
  disabled,
  value,
  onChange,
  ...props
}: NameInputProps) => {
  const inputId = id ?? name
  return (
    <div className="w-full space-y-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700"
      >
        Name
      </label>
      <InputGroup
        className={cn(
          "overflow-hidden rounded-lg py-6",
          disabled && "opacity-60",
          containerClassName
        )}
      >
        <InputGroupInput
          id={inputId}
          type="text"
          placeholder="Username"
          className={cn("min-w-0 flex-1", className)}
          name={name}
          disabled={disabled}
          value={value}
          onChange={onChange}
          aria-invalid={!!message}
          {...props}
        />
        <InputGroupAddon>
          <User />
        </InputGroupAddon>
      </InputGroup>
      <InputErrorMessage message={message} />
    </div>
  )
}
