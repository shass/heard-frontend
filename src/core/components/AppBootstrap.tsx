'use client'

/**
 * AppBootstrap Component
 *
 * Initializes the application by registering all plugins
 * Must be called once before any platform-dependent code runs
 */

import { useEffect, useState } from 'react'
import { bootstrapApplication } from '@/src/app-bootstrap'
import {
  withRetry,
  isOffline,
  getUserFriendlyMessage,
  ERROR_MESSAGES
} from '@/src/core/utils/error-handling'
import { PlatformErrorBoundary } from './ErrorBoundary'

interface AppBootstrapProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReady?: () => void
}

export function AppBootstrap({ children, fallback, onReady }: AppBootstrapProps) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        // Check for offline state first
        if (isOffline()) {
          throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
        }

        // Bootstrap with retry logic
        await withRetry(
          () => bootstrapApplication(),
          {
            maxAttempts: 3,
            baseDelay: 1000,
            onRetry: (attempt, error) => {
              if (isMounted) {
                setRetryCount(attempt)
              }

              if (process.env.NODE_ENV === 'development') {
                console.log(`[AppBootstrap] Retry attempt ${attempt}:`, error.message)
              }
            }
          }
        )

        if (isMounted) {
          setIsReady(true)
          setRetryCount(0)
          onReady?.()
        }
      } catch (err) {
        console.error('[AppBootstrap] Initialization failed:', err)

        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [onReady])

  if (error) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#e53e3e', marginBottom: '15px' }}>
          Unable to Start Application
        </h1>
        <p style={{ color: '#4a5568', marginBottom: '20px', fontSize: '16px' }}>
          {getUserFriendlyMessage(error)}
        </p>
        {isOffline() && (
          <p style={{ color: '#ed8936', marginBottom: '20px', fontSize: '14px' }}>
            You appear to be offline. Please check your internet connection.
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setError(null)
              setRetryCount(0)
              window.location.reload()
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reload Page
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#718096' }}>
              Debug Information
            </summary>
            <pre style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f7fafc',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    )
  }

  if (!isReady) {
    return fallback || (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', color: '#4a5568' }}>
          {retryCount > 0 ? `Retrying (attempt ${retryCount})...` : 'Loading...'}
        </p>
      </div>
    )
  }

  return (
    <PlatformErrorBoundary>
      {children}
    </PlatformErrorBoundary>
  )
}
