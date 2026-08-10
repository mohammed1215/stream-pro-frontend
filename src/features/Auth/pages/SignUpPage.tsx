import { SubmitButton } from "../../../components/SubmitButton"
import { PasswordInput } from "../../../components/PasswordInput"
import { EmailInput } from "../../../components/EmailInput"
import { useState } from "react"
import { Link } from "react-router-dom"

export const SignUpPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? "Please enter your email" : "",
        password: !formData.password ? "Please enter your password" : "",
      })
      return
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center animate-page  px-3 bg-slate-50/50 dark:bg-background">
      {/* كارت أنظف، ظل أحدث، وحواف أنعم */}
      <div className="flex w-full max-w-sm flex-col gap-6 shadow-xl rounded-2xl border border-border bg-background p-8">
        {/* دايرة اللوجو بلون براند خفيف جداً */}
        <div className="flex justify-center items-center mx-auto bg-sky-50 dark:bg-sky-950 rounded-full size-24 mb-2">
          <img
            src="/logo_light_removed.png"
            className="mx-auto block size-16"
            alt="Logo"
          />
        </div>

        {/* العناوين */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up to Creator Studio to continue.
          </p>
        </div>

        <form className="flex flex-col gap-5 mt-2" onSubmit={handleSubmit}>
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

          <div className="pt-2">
            <SubmitButton>Create Account</SubmitButton>
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
