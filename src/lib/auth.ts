import axiosInstance from "./api"

// Login related types and function
type DeviceType = "ANDROID" | "IOS" | "WEB"
export interface LoginPayload {
  email: string
  password: string
  deviceId?: string
  deviceToken?: string
  deviceType?: DeviceType
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
}
export interface SignUpResponse {
  success: true
  data: {
    id: string
    email: string
    name: string
  }
}

export const signUpUser = async (
  payload: SignUpPayload
): Promise<SignUpResponse> => {
  return (
    await axiosInstance.post<SignUpResponse>("/api/v1/auth/register", payload)
  ).data
}
