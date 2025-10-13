// HTTP client for API communication

import { env } from '@/lib/env'
import type { ApiResponse, ApiError } from '@/lib/types'

class ApiClient {
  private baseURL: string
  private timeout: number

  constructor() {
    this.baseURL = env.API_URL
    this.timeout = env.API_TIMEOUT
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      // Don't set Content-Type for DELETE requests or when body is not present
      const shouldSetContentType = 
        options.method !== 'DELETE' && 
        (options.body !== undefined || options.method === 'POST')
      
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      }

      if (shouldSetContentType && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include', // Enable cookies for cross-origin requests
        headers,
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Log abort errors for debugging
      if (error.name === 'AbortError') {
        console.error('[ApiClient] Request was aborted:', url, error)
      }
      
      throw error
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      console.error('[ApiClient] 401 Unauthorized:', response.url)
      // Handle unauthorized - HttpOnly cookie will be cleared by server
      // No action needed on client side
    }

    if (!response.ok) {
      let errorData: ApiError
      try {
        errorData = await response.json()
        console.error('[ApiClient] Request failed:', {
          url: response.url,
          status: response.status,
          error: errorData
        })
      } catch {
        errorData = this.formatError(new Error(`HTTP ${response.status}: ${response.statusText}`))
      }
      throw errorData
    }

    const data: ApiResponse<T> = await response.json()
    return data.data
  }

  private formatError(error: any): ApiError {
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
  async get<T>(url: string, config?: RequestInit & { params?: Record<string, any> }): Promise<T> {
    let fullUrl = `${this.baseURL}${url}`
    
    // Handle query parameters
    if (config?.params) {
      const searchParams = new URLSearchParams()
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        fullUrl += `?${searchParams.toString()}`
      }
    }
    
    // Remove params from config before passing to fetch
    const { params, ...fetchConfig } = config || {}
    
    const response = await this.fetchWithTimeout(fullUrl, {
      method: 'GET',
      ...fetchConfig,
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(url: string, data?: any, config?: RequestInit): Promise<T> {
    const hasData = data !== undefined && data !== null
    
    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'POST',
      body: hasData ? JSON.stringify(data) : JSON.stringify({}),
      ...config,
    })
    
    const result = await this.handleResponse<T>(response)
    
    // Handle upload endpoints that return wrapped ApiResponse
    if (url.includes('/whitelist/upload')) {
      return result
    }
    
    return result
  }

  async put<T>(url: string, data?: any, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(url: string, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'DELETE',
      ...config,
      headers: {
        // Don't set Content-Type for DELETE requests without body
        ...config?.headers,
      },
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(url: string, data?: any, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
    return this.handleResponse<T>(response)
  }

  // File upload helper
  async uploadFile<T>(url: string, file: File, config?: RequestInit): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
        ...config?.headers,
      },
    })

    return this.handleResponse<T>(response)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient