import { SubmitButton } from "../../../components/SubmitButton"
import { PasswordInput } from "../../../components/PasswordInput"
import { EmailInput } from "../../../components/EmailInput"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { router } from "../../../router"
import {
  loginUser,
  type LoginPayload,
  type LoginResponse,
} from "../../../lib/auth"
import { AxiosError } from "axios"
import { useAuth } from "../hooks/useAuth"
import { getFcmToken } from "../../../config/firebase"
import { getDeviceId } from "../../../lib/helpers"

const LoginForm = () => {
  const login = useAuth((state) => state.login)

  const [formData, setFormData] = useState<LoginPayload>({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    global: "",
  })

  const loginMutation = useMutation<LoginResponse, unknown, LoginPayload>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const token = data.data.accessToken
      const userData = data.data.user
      login(userData, token)
      router.navigate("/")
    },
    onError: (error) => {
      // surface API error to the user
      if (error instanceof AxiosError && error.response) {
        const apiError = error.response.data as { message: string }
        setErrors((prev) => ({
          ...prev,
          global: apiError.message || "Invalid email or password",
        }))
      } else if (error instanceof Error) {
        setErrors((prev) => ({
          ...prev,
          global: error.message || "Invalid email or password",
        }))
      }
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear the error message for this field when it's being edited
    setErrors((prev) => ({ ...prev, [name]: "", global: "" }))
  }

  const isPending = loginMutation.isPending

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (isPending) return

    // Handle form submission logic here
    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? "Please enter your email" : "",
        password: !formData.password ? "Please enter your password" : "",
        global: "",
      })
      return
    }

    // request notification permission and get FCM token (non-blocking)
    let fcmToken: string | null = null
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          fcmToken = await getFcmToken()
        }
      } catch {
        // notifications are optional — continue without a token
      }
    }
    loginMutation.mutate({
      ...formData,
      deviceType: "WEB",
      deviceId: getDeviceId(),
      deviceToken: fcmToken ?? undefined,
    })
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
      aria-busy={isPending}
    >
      {errors.global && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-center text-destructive"
        >
          {errors.global}
        </p>
      )}
      {/* Email and Password Inputs */}
      <fieldset disabled={isPending} className="flex flex-col gap-4">
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
      </fieldset>
      {/* Submit Button */}
      <SubmitButton isLoading={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </SubmitButton>
    </form>
  )
}

export const LoginPage = () => {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to Creator Studio to continue.
          </p>
        </div>
        <LoginForm />
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
