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
  ...props
}: NameInputProps) => {
  return (
    <div className="w-full space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        Name
      </label>
      <InputGroup
        className={cn("overflow-hidden rounded-lg py-6", containerClassName)}
        {...props}
      >
        <InputGroupInput
          type="text"
          placeholder="Username"
          className={cn("min-w-0 flex-1", className)}
          name={name}
        />
        <InputGroupAddon>
          <User />
        </InputGroupAddon>
      </InputGroup>
      <InputErrorMessage message={message} />
    </div>
  )
}
