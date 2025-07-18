// HTTP client for API communication

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { env } from '@/lib/env'
import type { ApiResponse, ApiError } from '@/lib/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: env.API_URL,
      timeout: env.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          this.clearAuthToken()
          // TODO: Add redirect to login page or trigger re-authentication
        }
        
        return Promise.reject(this.formatError(error))
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('heard_auth_token')
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('heard_auth_token', token)
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('heard_auth_token')
  }

  private formatError(error: any): ApiError {
    if (error.response?.data) {
      return error.response.data as ApiError
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
        details: error,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'unknown',
      },
    }
  }

  // Public methods for making requests
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config)
    return response.data.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config)
    return response.data.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config)
    return response.data.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config)
    return response.data.data
  }

  // Auth token management
  setToken(token: string): void {
    this.setAuthToken(token)
  }

  clearToken(): void {
    this.clearAuthToken()
  }

  // File upload helper
  async uploadFile<T>(url: string, file: File, config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient