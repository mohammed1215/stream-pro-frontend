import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { toastCustom } from "./helper"
import { env } from "./env"

const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
})

// Raw client without response interceptors, used for auth endpoints
// (refresh / logout). This prevents retry loops, duplicate error toasts
// and spurious "session expired" events when those calls fail.
export const rawApi = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
})

rawApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("stream_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let isLoggingOut = false

// Set to true while an intentional logout is in flight so background
// 401s fail silently instead of toasting / firing session-expired.
export const setLoggingOut = (value: boolean) => {
  isLoggingOut = value
}

let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []
interface CustomAxiosRequestConfig {
  skipErrorToast?: boolean
}

const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("stream_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
}

axiosInstance.interceptors.request.use(attachToken)

function extractErrorMessage(error: AxiosError): string {
  const data = error.response?.data as
    | { message?: string | string[]; error?: string }
    | undefined

  if (!data) return "Something went wrong. Please try again."

  if (Array.isArray(data.message)) {
    return data.message.join(", ")
  }

  return data.message || data.error || "Something went wrong. Please try again."
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token as string)
    }
  })
  failedQueue = []
}

const isAuthRequest = (url?: string) => !!url && url.includes("/api/v1/auth/")

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
    } & CustomAxiosRequestConfig

    // Intentional logout in progress: fail silently. No refresh attempt,
    // no toasts, no session-expired event.
    if (isLoggingOut) {
      return Promise.reject(error)
    }

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRequest(originalRequest?.url)
    ) {
      // No access token left (e.g. already logged out): refreshing is
      // pointless, skip straight to the generic error handling below.
      if (!localStorage.getItem("stream_token")) {
        if (!originalRequest?.skipErrorToast) {
          const message = extractErrorMessage(error)
          toastCustom().error(message)
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Bypass interceptors: a failing refresh must not toast itself
        // ("refresh token not found") nor trigger another refresh cycle.
        const { data } = await rawApi.post("/api/v1/auth/refresh")
        const accessToken =
          (data as { accessToken?: string })?.accessToken ??
          (data as { data?: { accessToken?: string } })?.data?.accessToken
        if (!accessToken) {
          throw new Error("No access token in refresh response")
        }
        localStorage.setItem("stream_token", accessToken)
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        if (!isLoggingOut) {
          toastCustom().error("Session expired. Please log in again.")
          window.dispatchEvent(new CustomEvent("auth:session-expired"))
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (!originalRequest?.skipErrorToast) {
      const message = extractErrorMessage(error)
      toastCustom().error(message)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
