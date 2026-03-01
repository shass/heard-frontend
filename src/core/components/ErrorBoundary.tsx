'use client'

/**
 * Error Boundary Component
 *
 * Catches React errors and displays fallback UI
 */

import React, { Component, ReactNode } from 'react'
import { getUserFriendlyMessage } from '@/src/core/utils/error-handling'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  context?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { context, onError } = this.props

    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorBoundary${context ? ` - ${context}` : ''}]`, error, errorInfo)
    }

    if (onError) {
      onError(error, errorInfo)
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.reset)
      }

      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h3 style={{ color: '#e53e3e', marginBottom: '10px' }}>
            Something went wrong
          </h3>
          <p style={{ color: '#4a5568', marginBottom: '15px' }}>
            {getUserFriendlyMessage(error)}
          </p>
          <button
            onClick={this.reset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return children
  }
}

/**
 * Platform Detection Error Boundary
 */
export function PlatformErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="Platform Detection"
      fallback={(error, reset) => (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#e53e3e', marginBottom: '15px' }}>
            Platform Detection Failed
          </h2>
          <p style={{ color: '#4a5568', marginBottom: '20px' }}>
            {getUserFriendlyMessage(error)}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

