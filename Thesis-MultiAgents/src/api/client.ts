import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'

// Request configuration
const TIMEOUT = 30000 // 30 seconds

// Create axios instance with default configuration
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// // Request interceptor - add auth token, logging, etc.
// axiosInstance.interceptors.request.use(
//   (request: InternalAxiosRequestConfig) => {
//     // Add authentication token if available
//     const token = localStorage.getItem('access_token')
//     if (token && request.headers) {
//       request.headers.Authorization = `Bearer ${token}`
//     }

//     // Log request in development
//     if (import.meta.env.DEV) {
//       console.log('🚀 API Request:', {
//         method: request.method?.toUpperCase(),
//         url: request.url,
//         data: request.data,
//       })
//     }

//     return request
//   },
//   (error) => {
//     console.error('❌ Request Error:', error)
//     return Promise.reject(error)
//   }
// )

// // Response interceptor - handle errors, transform data, etc.
// axiosInstance.interceptors.response.use(
//   (response: AxiosResponse) => {
//     // Log response in development
//     if (import.meta.env.DEV) {
//       console.log('✓ API Response:', {
//         status: response.status,
//         url: response.config.url,
//         data: response.data,
//       })
//     }

//     return response
//   },
//   (error) => {
//     // Handle different error scenarios
//     if (error.response) {
//       // Server responded with error status
//       const { status, data } = error.response

//       switch (status) {
//         case 401:
//           // Unauthorized - clear token and redirect to login
//           localStorage.removeItem('access_token')
//           window.location.href = '/login'
//           break
//         case 403:
//           console.error('❌ Forbidden: Access denied')
//           break
//         case 404:
//           console.error('❌ Not Found: Resource does not exist')
//           break
//         case 500:
//           console.error('❌ Server Error: Internal server error')
//           break
//         default:
//           console.error(`❌ Error ${status}:`, data?.message || 'Unknown error')
//       }
//     } else if (error.request) {
//       // Request made but no response received
//       console.error('❌ Network Error: No response from server')
//     } else {
//       // Error in request configuration
//       console.error('❌ Request Setup Error:', error.message)
//     }

//     return Promise.reject(error)
//   }
// )

// Generic request wrapper with type safety
export const request = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await axiosInstance.request<T>(config)
    return response.data
  } catch (error) {
    throw error
  }
}

// Convenience methods
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'GET', url })
}

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'POST', url, data })
}

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'PUT', url, data })
}

export const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'PATCH', url, data })
}

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'DELETE', url })
}

/**
 * Streaming LLM responses using Server-Sent Events
 */
export const streamLLMResponse = async (
  url: string,
  data: any,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    const response = await axiosInstance.post(url, data, {
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream',
      },
      adapter: 'fetch', // Use fetch adapter for better streaming support
      onDownloadProgress: (progressEvent) => {
        const xhr = progressEvent.event.target as XMLHttpRequest
        const responseText = xhr.responseText

        // Parse SSE format: "data: {...}\n\n"
        const lines = responseText.split('\n\n')
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const chunk = line.slice(6) // Remove "data: " prefix
            if (chunk !== '[DONE]') {
              onChunk(chunk)
            }
          }
        })
      }
    })

    onComplete?.()
  } catch (error) {
    onError?.(error as Error)
  }
}

export default axiosInstance
