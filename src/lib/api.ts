import axios, { AxiosError } from "axios"
import { toastCustom } from "./helpers"
import { refreshToken } from "./auth"

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []
interface CustomAxiosRequestConfig {
  skipErrorToast?: boolean
}

axiosInstance.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem(
    "stream_token"
  )}`
  return config
})

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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
    } & CustomAxiosRequestConfig

    if (error.response?.status === 401 && !originalRequest?._retry) {
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
        const data = await refreshToken()
        localStorage.setItem("stream_token", data.accessToken)
        processQueue(null, data.accessToken)

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        toastCustom().error("Session expired. Please log in again.")
        window.dispatchEvent(new CustomEvent("auth:session-expired"))
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
