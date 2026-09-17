import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import { SubmitButton } from "../../../components/SubmitButton"
import { PasswordInput } from "../../../components/PasswordInput"
import { EmailInput } from "../../../components/EmailInput"
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
    if (!validate()) return

    signUpMutation.mutate({
      name: formData.name.trim(),
      email: formData.email,
      password: formData.password,
    })
  }

  return (
    <div className="flex h-screen w-full items-center justify-center animate-page px-3 bg-slate-50/50 dark:bg-background">
      <div className="flex w-full max-w-sm flex-col gap-6 shadow-xl rounded-2xl border border-border bg-background p-8">
        <div className="flex justify-center items-center mx-auto bg-sky-50 dark:bg-sky-950 rounded-full size-24 mb-2">
          <img
            src="/logo_light_removed.png"
            className="mx-auto block size-16"
            alt="Logo"
          />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up to Creator Studio to continue.
          </p>
        </div>

        <form
          className="flex flex-col gap-5 mt-2"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="w-full space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              aria-invalid={!!errors.name}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name}</p>
            ) : null}
          </div>

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
          />

          {serverError ? (
            <p className="text-sm text-destructive text-center">
              {serverError}
            </p>
          ) : null}

          <div className="pt-2">
            <SubmitButton disabled={signUpMutation.isPending}>
              {signUpMutation.isPending
                ? "Creating account..."
                : "Create Account"}
            </SubmitButton>
          </div>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
