import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import { SubmitButton } from "../../../components/SubmitButton"
import { PasswordInput } from "../../../components/PasswordInput"
import { EmailInput } from "../../../components/EmailInput"
import { NameInput } from "../../../components/NameInput"
import { signUpUser } from "../../../lib/auth"
import { useAuth } from "../hooks/useAuth"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

interface FormData {
  name: string
  email: string
  password: string
}

interface FormErrors {
  name: string
  email: string
  password: string
}

const EMPTY_ERRORS: FormErrors = { name: "", email: "", password: "" }

export const SignUpPage = () => {
  const navigate = useNavigate()
  const login = useAuth((state) => state.login)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS)
  const [serverError, setServerError] = useState("")

  const signUpMutation = useMutation({
    mutationFn: signUpUser,
    onSuccess: (response) => {
      login(response.data.user, response.data.accessToken)
      navigate("/", { replace: true })
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        if (error.response?.status === 409) {
          setErrors((prev) => ({
            ...prev,
            email: "This email is already registered",
          }))
          return
        }
        setServerError(
          error.response?.data?.message ??
            "Something went wrong. Please try again."
        )
        return
      }
      setServerError("Something went wrong. Please try again.")
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
    if (serverError) setServerError("")
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = { ...EMPTY_ERRORS }

    if (!formData.name.trim()) {
      nextErrors.name = "Please enter your name"
    }

    if (!formData.email) {
      nextErrors.email = "Please enter your email"
    } else if (!EMAIL_REGEX.test(formData.email)) {
      nextErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      nextErrors.password = "Please enter your password"
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }

    setErrors(nextErrors)
    return !nextErrors.name && !nextErrors.email && !nextErrors.password
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (signUpMutation.isPending) return
    if (!validate()) return

    signUpMutation.mutate({
      name: formData.name.trim(),
      email: formData.email,
      password: formData.password,
    })
  }

  const isPending = signUpMutation.isPending

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background px-3 py-8 animate-page">
      {/* decorative background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <img
            src="/logo_light_removed.png"
            className="block size-14 object-contain"
            alt="StreamPro logo"
          />
        </div>

        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up to Creator Studio to continue.
          </p>
        </div>

        <form
          className="mt-1 flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={isPending}
        >
          <fieldset disabled={isPending} className="flex flex-col gap-4">
            <NameInput
              name="name"
              value={formData.name}
              onChange={handleChange}
              message={errors.name}
              autoComplete="name"
            />

            <EmailInput
              name="email"
              value={formData.email}
              onChange={handleChange}
              message={errors.email}
            />
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              message={errors.password}
              autoComplete="new-password"
            />
          </fieldset>

          {serverError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
            >
              {serverError}
            </p>
          ) : null}

          <SubmitButton isLoading={isPending}>
            {isPending ? "Creating account..." : "Create Account"}
          </SubmitButton>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
