import * as React from "react"
import { Mail } from "lucide-react"

import { cn } from "../lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../components/ui/input-group"
import { InputErrorMessage } from "./InputErrorMessage"

type EmailInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  message?: string
  containerClassName?: string
}

export function EmailInput({
  message,
  containerClassName,
  className,
  name,
  ...props
}: EmailInputProps) {
  return (
    <div className="w-full space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        Email
      </label>
      <InputGroup
        className={cn("overflow-hidden rounded-lg  py-6", containerClassName)}
      >
        <InputGroupInput
          type="email"
          name={name}
          placeholder="Email"
          className={cn("min-w-0 flex-1 ", className)}
          {...props}
        />

        <InputGroupAddon>
          <Mail className="size-4" aria-hidden />
        </InputGroupAddon>
      </InputGroup>

      {message ? <InputErrorMessage message={message} /> : null}
    </div>
  )
}
