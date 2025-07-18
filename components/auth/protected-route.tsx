'use client'

import { useEffect } from 'react'
import { useIsAuthenticated, useAuthLoading } from '@/lib/store'
import { useAuthActions } from '@/components/providers/auth-provider'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated()
  const loading = useAuthLoading()
  
  // Get auth actions and wallet connection status
  const { login, checkAuth } = useAuthActions()
  const { isConnected } = useAccount()

  // Check authentication on mount
  useEffect(() => {
    if (isConnected && !isAuthenticated && !loading) {
      checkAuth()
    }
  }, [isConnected, isAuthenticated, loading, checkAuth])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show custom fallback if provided
  if (fallback && (!isConnected || !isAuthenticated)) {
    return <>{fallback}</>
  }

  // Show default auth required message
  if (!isConnected || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-600">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">
            Authentication Required
          </h3>
          
          <p className="text-zinc-600 mb-6">
            {!isConnected 
              ? "Please connect your wallet to access this feature."
              : "Please sign the message to verify your wallet ownership."
            }
          </p>

          <div className="space-y-3">
            {!isConnected ? (
              <ConnectButton />
            ) : (
              <Button
                onClick={login}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
              >
                {loading ? 'Signing...' : 'Sign Message to Continue'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}