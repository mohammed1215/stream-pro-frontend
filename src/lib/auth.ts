import axiosInstance, { rawApi } from "./api"

// Login related types and function
type DeviceType = "ANDROID" | "IOS" | "WEB"
export interface LoginPayload {
  email: string
  password: string
  deviceId?: string
  deviceToken?: string
  deviceType?: DeviceType
  deviceName?: string
  appVersion?: string
}

export interface LoginResponse {
  success: true
  data: {
    accessToken: string
    user: {
      id: string
      email: string
      name: string
      avatarUrl: string
    }
  }
}
export const loginUser = async (
  payload: LoginPayload
): Promise<LoginResponse> => {
  return (
    await axiosInstance.post<LoginResponse>("/api/v1/auth/login", payload)
  ).data
}

// SignUp related types and function
export interface SignUpPayload {
  email: string
  password: string
  name: string
  deviceId?: string
  deviceToken?: string
  deviceType?: DeviceType
  deviceName?: string
  appVersion?: string
}
export interface SignUpResponse {
  success: true
  data: {
    accessToken: string
    user: {
      id: string
      email: string
      name: string
      avatarUrl: string | null
    }
  }
}

export const signUpUser = async (
  payload: SignUpPayload
): Promise<SignUpResponse> => {
  return (
    await axiosInstance.post<SignUpResponse>("/api/v1/auth/register", payload)
  ).data
}

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  // Raw client: never toast, never retry, never fire session-expired.
  const { data } = await rawApi.post("/api/v1/auth/refresh")
  const accessToken =
    (data as { accessToken?: string })?.accessToken ??
    (data as { data?: { accessToken?: string } })?.data?.accessToken
  return { accessToken: accessToken as string }
}

export const logoutUser = async (): Promise<void> => {
  // Raw client: a failing logout (e.g. already-expired session) must stay
  // silent — the caller logs out locally regardless.
  await rawApi.post("/api/v1/auth/logout")
}

export const logoutAllOtherDevices = async (): Promise<void> => {
  await rawApi.post("/api/v1/auth/logout-all")
}

export const revokeSession = async (sessionId: string): Promise<void> => {
  await axiosInstance.post(`/api/v1/sessions/${sessionId}/revoke`)
}

export const editProfile = async (
  payload: {
    avatar: File | null
    name: string
  },
  onProgress?: (percent: number) => void
): Promise<{
  success: boolean
  data: {
    id: string
    email: string
    avatarUrl: string
    name: string
    createdAt: string
    updatedAt: string
  }
}> => {
  return await axiosInstance.patchForm<{
    success: boolean
    data: {
      id: string
      email: string
      avatarUrl: string
      name: string
      createdAt: string
      updatedAt: string
    }
  }>("/api/v1/profile/me", payload, {
    onUploadProgress: (progressEvent) => {
      const progress = Math.round(
        progressEvent.progress ? progressEvent.progress * 100 : 0
      )
      onProgress?.(progress)
    },
  })
}
