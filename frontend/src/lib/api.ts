import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getAuthToken, clearAuth } from '@/store/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
      timeout: 30000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAuthToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        const correlationId = this.generateCorrelationId()
        if (config.headers) {
          config.headers['X-Correlation-ID'] = correlationId
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          clearAuth()
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=1'
          }
        }

        if (error.response?.status === 403) {
          // Handle forbidden - could show a toast or redirect
        }

        if (error.response?.status === 422) {
          // Validation errors - let the component handle them
        }

        if (error.response?.status && error.response.status >= 500) {
          // Server errors
        }

        return Promise.reject(error)
      }
    )
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  }

  /**
   * GET request. Returns the response body directly.
   * Accepts either `api.get(url, paramsObject)` or axios-style `api.get(url, { params })`.
   */
  async get<T>(url: string, paramsOrConfig?: Record<string, unknown> | { params?: Record<string, unknown> }) {
    const config =
      paramsOrConfig && typeof paramsOrConfig === 'object' && 'params' in paramsOrConfig
        ? (paramsOrConfig as { params?: Record<string, unknown> })
        : { params: paramsOrConfig }
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown) {
    const response = await this.client.post<T>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: unknown) {
    const response = await this.client.put<T>(url, data)
    return response.data
  }

  async patch<T>(url: string, data?: unknown) {
    const response = await this.client.patch<T>(url, data)
    return response.data
  }

  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url)
    return response.data
  }

  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  }

  getClient(): AxiosInstance {
    return this.client
  }
}

export const api = new ApiClient()

// API Error types
export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
  correlation_id?: string
}

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as Record<string, unknown>).success === false
  )
}

export function isApiSuccess<T>(response: unknown): response is ApiSuccess<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as Record<string, unknown>).success === true
  )
}