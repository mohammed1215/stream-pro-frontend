import axiosInstance from "./api"

export interface CategoryResponse {
  id: string
  name: string
}

export const getCategoriesApi = async () => {
  const res = await axiosInstance.get<CategoryResponse[]>("/api/v1/categories")
  return res.data
}
