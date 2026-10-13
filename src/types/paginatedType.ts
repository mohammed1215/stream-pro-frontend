export interface PaginatedType<T> {
  items: T[]
  pageSize: number
  pageNumber: number
  totalPages: number
  totalCount?: number
  hasNextPage: boolean
}
