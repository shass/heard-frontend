'use client'

import { useIsAuthenticated, useAuthLoading, useUser } from '@/lib/store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/loading-states'

interface AdminRouteProps {
  children: React.ReactNode
  fallbackPath?: string
}

export function AdminRoute({ 
  children, 
  fallbackPath = '/' 
}: AdminRouteProps) {
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const loading = useAuthLoading()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(fallbackPath)
      return
    }

    if (!loading && isAuthenticated && user) {
      if (user.role !== 'admin') {
        router.push(fallbackPath)
        return
      }
    }
  }, [user, isAuthenticated, loading, router, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please connect your wallet to continue.</p>
        </div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page. Admin access required.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}