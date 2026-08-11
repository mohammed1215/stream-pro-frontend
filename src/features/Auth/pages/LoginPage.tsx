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
  const { login } = useAuth()

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
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()

    // request notification permission and get FCM token
    let fcmToken: string | null = null
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        console.log("Notification permission granted.")
        fcmToken = await getFcmToken()
      } else {
        alert(
          "Notification permission denied. You won't receive notifications."
        )
      }
    }
    // Handle form submission logic here
    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? "Please enter your email" : "",
        password: !formData.password ? "Please enter your password" : "",
        global: "",
      })
    }
    loginMutation.mutate({
      ...formData,
      deviceType: "WEB",
      deviceId: getDeviceId(),
      deviceToken: fcmToken ?? undefined,
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {errors.global && (
        <p className="text-red-500 text-sm text-center">{errors.global}</p>
      )}
      {/* Email and Password Inputs */}
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
      {/* Submit Button */}
      <SubmitButton>Sign In</SubmitButton>
    </form>
  )
}

export const LoginPage = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center  animate-page px-3">
      <div className="flex w-full max-w-lg flex-col gap-4 shadow-lg rounded-lg border border-border bg-background p-6">
        <div className="flex justify-center items-center  mx-auto bg-accent rounded-full size-50">
          <img
            src="/logo_light_removed.png"
            className="mx-auto block size-40"
            alt="logo"
          />
        </div>
        <h1 className="text-2xl font-bold text-center text-foreground">
          Welcome Back
        </h1>
        <p className="text-center text-foreground">
          Sign in to Creator Studio to continue.
        </p>
        <LoginForm />
        <p className="text-sm text-muted-foreground text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
