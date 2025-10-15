'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/loading-states'
import { Wallet, Shield, ArrowLeft } from 'lucide-react'
import { useAdminAuth } from '@/src/platforms/web/hooks/useAdminAuth'
import Link from 'next/link'

interface AdminAuthWrapperProps {
  children: React.ReactNode
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const router = useRouter()
  const { openConnectModal } = useConnectModal()
  const {
    login,
    isAuthenticated,
    user,
    isLoading: authLoading,
    isConnected,
    address
  } = useAdminAuth()
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const handleCreateSession = async (event?: React.MouseEvent) => {
    // Prevent any default behavior
    event?.preventDefault()
    event?.stopPropagation()

    if (!isConnected) return

    // Prevent double calls
    if (isCreatingSession) {
      console.log('[AdminAuthWrapper] Already creating session, skipping...')
      return
    }

    setIsCreatingSession(true)
    try {
      console.log('[AdminAuthWrapper] Creating session...')
      await login()
      console.log('[AdminAuthWrapper] Session created successfully')
    } catch (error) {
      console.error('[AdminAuthWrapper] Failed to create session:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Loading state while checking authentication
  if (authLoading || isCreatingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }

  // If wallet not connected, show connect wallet button
  if (!isConnected) {
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
  }

  // If wallet connected but not authenticated, show create session button
  if (isConnected && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
            <p className="text-gray-600 mb-2">
              Sign a message to create a session with the backend
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
            Create Session
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
  }

  // If authenticated, render children
  if (isAuthenticated && user) {
    // Double-check admin role
    if (user.role !== 'admin') {
      router.push('/')
      return null
    }

    return <>{children}</>
  }

  // Default loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size="lg" />
    </div>
  )
}
