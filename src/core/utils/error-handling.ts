/**
 * Error Handling Utilities
 *
 * Provides retry logic, timeout handling, and user-friendly error messages
 */

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

export interface TimeoutOptions {
  timeoutMs?: number
  timeoutMessage?: string
}

/**
 * Retry async operation with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts) {
        break
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)

      if (onRetry) {
        onRetry(attempt, lastError)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`, lastError.message)
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Add timeout to async operation
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const {
    timeoutMs = 5000,
    timeoutMessage = 'Operation timed out'
  } = options

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  )

  return Promise.race([promise, timeout])
}

/**
 * Check if browser is offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection and try again.',
  TIMEOUT: 'The operation is taking too long. Please try again.',
  ACCESS_CHECK_FAILED: "We couldn't verify your access. Please try again in a moment.",
  PLATFORM_DETECTION_FAILED: 'Unable to detect platform. Please reload the page.',
  SURVEY_LOAD_FAILED: 'Unable to load survey. Please try again.',
  WHITELIST_CHECK_FAILED: "We couldn't verify your whitelist status. Please try again.",
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const

/**
 * Get user-friendly error message from error
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR

  if (error instanceof Error) {
    // Network errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }

    // Return the error message if it looks user-friendly (no stack traces, etc.)
    if (error.message && error.message.length < 200 && !error.message.includes('at ')) {
      return error.message
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Safe fallback execution
 * Returns fallback value if operation fails
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))

    if (onError) {
      onError(err)
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('[Fallback] Operation failed, using fallback:', err.message)
    }

    return fallback
  }
}

/**
 * Graceful degradation wrapper
 * Attempts operation, but allows graceful failure
 */
export async function gracefullyDegrade<T>(
  operation: () => Promise<T>,
  degradedValue: T,
  options: {
    retryOptions?: RetryOptions
    timeoutMs?: number
    onDegradation?: (error: Error) => void
  } = {}
): Promise<T> {
  try {
    const fn = options.retryOptions
      ? () => withRetry(operation, options.retryOptions)
      : operation

    if (options.timeoutMs) {
      return await withTimeout(fn(), { timeoutMs: options.timeoutMs })
    }

    return await fn()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))

    if (options.onDegradation) {
      options.onDegradation(err)
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('[Graceful Degradation] Using degraded value:', err.message)
    }

    return degradedValue
  }
}

/**
 * Log error only in development
 */
export function devError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error)
  }
}

/**
 * Create error with context
 */
export function createError(message: string, context?: string, cause?: Error): Error {
  const error = new Error(context ? `[${context}] ${message}` : message)
  if (cause) {
    (error as any).cause = cause
  }
  return error
}
