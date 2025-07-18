'use client'

import { useCallback } from 'react'
import { useNotifications } from '@/components/ui/notifications'
import { parseApiError } from '@/lib/error-handler'

export interface ErrorHandlerOptions {
  showNotification?: boolean
  notificationTitle?: string
  logError?: boolean
  fallbackMessage?: string
  onError?: (error: Error) => void
}

export function useErrorHandler() {
  const notifications = useNotifications()
  
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showNotification = true,
      notificationTitle = 'Error',
      logError = true,
      fallbackMessage = 'An unexpected error occurred',
      onError
    } = options
    
    // Parse the error
    const parsedError = parseApiError(error)
    
    // Log error if enabled
    if (logError) {
      console.error('Error handled:', parsedError, error)
    }
    
    // Show notification if enabled
    if (showNotification) {
      notifications.error(
        notificationTitle,
        parsedError.message || fallbackMessage,
        { 
          duration: parsedError.retryable ? 5000 : 8000,
          action: parsedError.retryable ? {
            label: 'Retry',
            onClick: () => onError?.(parsedError)
          } : undefined
        }
      )
    }
    
    // Call custom error handler if provided
    if (onError) {
      onError(parsedError)
    }
    
    return parsedError
  }, [notifications])
  
  const handleAsyncError = useCallback((
    asyncFn: () => Promise<void>,
    options: ErrorHandlerOptions = {}
  ) => {
    return async () => {
      try {
        await asyncFn()
      } catch (error) {
        handleError(error, options)
      }
    }
  }, [handleError])
  
  const withErrorHandler = useCallback(<T extends (...args: any[]) => Promise<any>>(
    asyncFn: T,
    options: ErrorHandlerOptions = {}
  ) => {
    return ((...args: Parameters<T>) => {
      return asyncFn(...args).catch((error) => {
        handleError(error, options)
        throw error // Re-throw to maintain promise chain
      })
    }) as T
  }, [handleError])
  
  return {
    handleError,
    handleAsyncError,
    withErrorHandler
  }
}

// Specialized error handlers for different contexts
export function useSurveyErrorHandler() {
  const { handleError } = useErrorHandler()
  
  return useCallback((error: unknown) => {
    return handleError(error, {
      notificationTitle: 'Survey Error',
      fallbackMessage: 'Failed to load survey. Please try again.'
    })
  }, [handleError])
}

export function useAuthErrorHandler() {
  const { handleError } = useErrorHandler()
  
  return useCallback((error: unknown) => {
    return handleError(error, {
      notificationTitle: 'Authentication Error',
      fallbackMessage: 'Authentication failed. Please try connecting your wallet again.'
    })
  }, [handleError])
}

export function useAPIErrorHandler() {
  const { handleError } = useErrorHandler()
  
  return useCallback((error: unknown) => {
    return handleError(error, {
      notificationTitle: 'API Error',
      fallbackMessage: 'Server request failed. Please check your connection and try again.'
    })
  }, [handleError])
}