// Global error handling and retry logic

import { useUIStore } from '@/lib/store'
import type { ApiError } from '@/lib/types'

export interface ErrorHandlerOptions {
  showNotification?: boolean
  notificationDuration?: number
  logError?: boolean
  retryable?: boolean
}

export class AppError extends Error {
  code: string
  statusCode?: number
  retryable: boolean
  details?: any

  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR', 
    statusCode?: number,
    retryable: boolean = false,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.retryable = retryable
    this.details = details
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', undefined, true)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, false)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403, false)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, false, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404, false)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT_ERROR', 409, false, details)
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Server error occurred') {
    super(message, 'SERVER_ERROR', 500, true)
  }
}

/**
 * Convert API error to AppError
 */
export function parseApiError(error: any): AppError {
  // If it's already an AppError, return as-is
  if (error instanceof AppError) {
    return error
  }

  // Handle axios errors
  if (error.response) {
    const status = error.response.status
    const data = error.response.data as ApiError

    // Handle structured API errors
    if (data && !data.success) {
      const { code, message, details } = data.error
      
      switch (status) {
        case 400:
          return new ValidationError(message, details)
        case 401:
          return new AuthenticationError(message)
        case 403:
          return new AuthorizationError(message)
        case 404:
          return new NotFoundError(message)
        case 409:
          return new ConflictError(message, details)
        case 500:
        case 502:
        case 503:
        case 504:
          return new ServerError(message)
        default:
          return new AppError(message, code, status, status >= 500)
      }
    }

    // Handle non-structured errors
    switch (status) {
      case 401:
        return new AuthenticationError()
      case 403:
        return new AuthorizationError()
      case 404:
        return new NotFoundError()
      case 500:
        return new ServerError()
      default:
        return new AppError(
          error.message || 'Request failed',
          'HTTP_ERROR',
          status,
          status >= 500
        )
    }
  }

  // Handle network errors
  if (error.request) {
    return new NetworkError(error.message)
  }

  // Handle other errors
  return new AppError(
    error.message || 'Unknown error occurred',
    'UNKNOWN_ERROR',
    undefined,
    false
  )
}

/**
 * Global error handler
 */
export function handleError(error: any, options: ErrorHandlerOptions = {}) {
  const {
    showNotification = true,
    notificationDuration = 5000,
    logError = true,
    retryable
  } = options

  const appError = parseApiError(error)

  // Log error to console in development
  if (logError && process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      retryable: appError.retryable,
      details: appError.details,
      stack: appError.stack
    })
  }

  // Show notification if requested
  if (showNotification) {
    const { addNotification } = useUIStore.getState()
    
    addNotification({
      type: 'error',
      title: getErrorTitle(appError),
      message: appError.message,
      duration: notificationDuration
    })
  }

  // Handle specific error types
  switch (appError.code) {
    case 'AUTHENTICATION_ERROR':
      // Trigger logout/re-authentication
      handleAuthenticationError()
      break
      
    case 'NETWORK_ERROR':
      // Could trigger offline mode
      break
      
    case 'SERVER_ERROR':
      // Could trigger retry mechanism
      break
  }

  return appError
}

/**
 * Get user-friendly error title
 */
function getErrorTitle(error: AppError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Connection Error'
    case 'AUTHENTICATION_ERROR':
      return 'Authentication Required'
    case 'AUTHORIZATION_ERROR':
      return 'Access Denied'
    case 'VALIDATION_ERROR':
      return 'Invalid Input'
    case 'NOT_FOUND_ERROR':
      return 'Not Found'
    case 'CONFLICT_ERROR':
      return 'Conflict'
    case 'SERVER_ERROR':
      return 'Server Error'
    default:
      return 'Error'
  }
}

/**
 * Handle authentication errors
 */
function handleAuthenticationError() {
  // Import auth store dynamically to avoid circular dependencies
  import('@/lib/store').then(({ useAuthStore }) => {
    const { logout } = useAuthStore.getState()
    logout()
  })
}

/**
 * Retry logic with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    backoffFactor?: number
    retryCondition?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => parseApiError(error).retryable
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay
      const totalDelay = delay + jitter

      await new Promise(resolve => setTimeout(resolve, totalDelay))
    }
  }

  throw lastError
}

/**
 * React Query error handler
 */
export function queryErrorHandler(error: any) {
  return handleError(error, {
    showNotification: true,
    logError: true
  })
}

/**
 * Mutation error handler
 */
export function mutationErrorHandler(error: any) {
  return handleError(error, {
    showNotification: true,
    logError: true
  })
}