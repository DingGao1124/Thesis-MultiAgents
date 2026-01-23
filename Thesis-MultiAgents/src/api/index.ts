import { get, post, put, del } from './client'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
