import { get, post, put, del } from './config/client'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
