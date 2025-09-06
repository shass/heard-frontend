export const RETRY_CONDITIONS = {
  // Retry only on network/server errors, not user errors
  retryableStatuses: [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524],
  retryableErrors: [
    'NetworkError',
    'TypeError', // Network issues
    'Failed to fetch',
    'Network request failed',
    'Connection timeout'
  ],
  // Never retry these (user actions)
  nonRetryableErrors: [
    'User rejected',
    'User denied',
    'MetaMask Tx Signature',
    'User cancelled',
    'Authentication failed' // Backend validation errors
  ]
} as const

export function shouldRetry(error: Error, response?: Response): boolean {
  const errorMessage = error.message.toLowerCase()
  
  // Check if it's a user rejection/cancellation
  for (const nonRetryable of RETRY_CONDITIONS.nonRetryableErrors) {
    if (errorMessage.includes(nonRetryable.toLowerCase())) {
      return false
    }
  }
  
  // Check HTTP status codes
  if (response?.status) {
    return RETRY_CONDITIONS.retryableStatuses.includes(response.status as any)
  }
  
  // Check network errors
  for (const retryableError of RETRY_CONDITIONS.retryableErrors) {
    if (errorMessage.includes(retryableError.toLowerCase())) {
      return true
    }
  }
  
  return false
}