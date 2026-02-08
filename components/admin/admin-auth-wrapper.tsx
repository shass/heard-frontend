'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/loading-states'
import { Wallet, Shield, ArrowLeft, AlertTriangle, ShieldX } from 'lucide-react'
import { useAuth } from '@/src/platforms/_core/hooks/useAuth'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { resolveAdminAuthPhase } from '@/lib/admin/admin-auth-state-machine'

interface AdminAuthWrapperProps {
  children: React.ReactNode
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const router = useRouter()
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()
  const { authenticate, logout } = useAuth()

  const user = useAuthStore(state => state.user)
  const loading = useAuthStore(state => state.loading)
  const initialized = useAuthStore(state => state.initialized)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [authAttemptFailed, setAuthAttemptFailed] = useState(false)

  const phase = resolveAdminAuthPhase({
    initialized,
    loading,
    isConnected,
    isAuthenticated,
    isCreatingSession,
    authAttemptFailed,
    user: user ? { role: user.role, walletAddress: user.walletAddress } : null,
    connectedAddress: address,
  })

  const handleCreateSession = useCallback(async () => {
    if (!isConnected || isCreatingSession) return

    setIsCreatingSession(true)
    setAuthAttemptFailed(false)
    try {
      const result = await authenticate()
      if (!result?.success) {
        setAuthAttemptFailed(true)
      }
    } catch (error) {
      console.error('[AdminAuthWrapper] Failed to create session:', error)
      setAuthAttemptFailed(true)
    } finally {
      setIsCreatingSession(false)
    }
  }, [isConnected, isCreatingSession, authenticate])

  // Side effects based on phase
  useEffect(() => {
    if (phase === 'wallet_mismatch') {
      console.error('[AdminAuthWrapper] SECURITY: Wallet mismatch! Logging out...')
      logout()
    }
    if (phase === 'access_denied') {
      console.error('[AdminAuthWrapper] SECURITY: Non-admin user attempting access')
      router.push('/')
    }
    // Auto-authenticate on admin page: no reason to wait for manual click
    if (phase === 'authenticate') {
      handleCreateSession()
    }
  }, [phase, logout, router, handleCreateSession])

  switch (phase) {
    case 'initializing':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Spinner size="lg" />
        </div>
      )

    case 'connect_wallet':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-zinc-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
              <p className="text-gray-600">
                Please connect your admin wallet to access the dashboard
              </p>
            </div>

            <Button
              type="button"
              onClick={() => openConnectModal?.()}
              size="lg"
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-8"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </Button>

            <div className="mt-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )

    case 'authenticate':
    case 'authenticating':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Authenticating...</h1>
              <p className="text-gray-600 mb-2">
                Please sign the message in your wallet to verify admin access
              </p>
              <p className="text-sm text-gray-500">
                Connected as: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
              </p>
            </div>

            <Spinner size="lg" />

            <div className="mt-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )

    case 'auth_failed':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
              <p className="text-gray-600 mb-2">
                Sign the message in your wallet to verify admin access
              </p>
              <p className="text-sm text-gray-500">
                Connected as: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCreateSession}
              size="lg"
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-8"
            >
              <Shield className="w-5 h-5 mr-2" />
              Retry
            </Button>

            <div className="mt-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )

    case 'wallet_mismatch':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet Mismatch</h1>
              <p className="text-gray-600">
                The connected wallet does not match your authenticated session. Please reconnect with the correct wallet.
              </p>
            </div>
          </div>
        </div>
      )

    case 'access_denied':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldX className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">
                You do not have admin privileges. Redirecting...
              </p>
            </div>
          </div>
        </div>
      )

    case 'authorized':
      return <>{children}</>
  }
}
