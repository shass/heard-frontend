'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    
    // Here you could send error to monitoring service
    // Example: sendErrorToMonitoring(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isAuthError = error.message.includes('auth') || error.message.includes('unauthorized')
  
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">
            Something went wrong
          </h1>
          <p className="text-zinc-600">
            {isNetworkError 
              ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
              : isAuthError
              ? "There was an authentication issue. Please try signing in again."
              : "An unexpected error occurred. Our team has been notified and we're working to fix it."
            }
          </p>
        </div>
        
        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-zinc-50 rounded-lg p-4 border border-zinc-200">
            <summary className="text-sm font-medium text-zinc-700 cursor-pointer hover:text-zinc-900">
              <Bug className="w-4 h-4 inline mr-1" />
              Error Details (Development)
            </summary>
            <div className="mt-2 text-xs text-zinc-600 font-mono">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              <div className="mb-2">
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
              </div>
              {errorInfo && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={resetError}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
        
        {/* Support Link */}
        <p className="text-sm text-zinc-500">
          If this problem persists, please{' '}
          <a 
            href="mailto:support@heardlabs.com" 
            className="text-zinc-700 hover:text-zinc-900 underline"
          >
            contact our support team
          </a>
        </p>
      </div>
    </div>
  )
}

// Specialized error fallbacks for different contexts
export function SurveyErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="w-full py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">Survey Error</h2>
        <p className="text-zinc-600 mb-4">
          We couldn't load this survey. This might be due to a network issue or the survey may no longer be available.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={resetError} className="bg-zinc-900 hover:bg-zinc-800 text-white">
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AuthErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="w-full py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">Authentication Error</h2>
        <p className="text-zinc-600 mb-4">
          There was a problem with your authentication. Please try connecting your wallet again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={resetError} className="bg-zinc-900 hover:bg-zinc-800 text-white">
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary