'use client'

import { useEffect, useRef } from 'react'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store'

/**
 * WebAuthInitializer - Global auth session checker for Web platform
 *
 * Responsibilities:
 * - Checks for existing auth session on app mount (once)
 * - Restores user data from backend if session is valid
 * - Prevents duplicate auth checks across multiple components
 *
 * IMPORTANT: Only for Web platform - Base App and Farcaster have their own auth flows
 */
export function WebAuthInitializer() {
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitialized.current) {
      console.log('[WebAuthInitializer] Already initialized, skipping')
      return
    }

    const initializeAuth = async () => {
      console.log('[WebAuthInitializer] Starting auth initialization...')
      const { setUser, setLoading, logout: storeLogout, setInitialized } = useAuthStore.getState()

      // CRITICAL: Set initialized=true IMMEDIATELY to prevent race condition
      // This prevents other components from calling checkAuth while we're initializing
      setInitialized(true)
      hasInitialized.current = true

      setLoading(true)

      try {
        const userData = await authApi.checkAuth()

        if (userData) {
          console.log('[WebAuthInitializer] Session restored:', {
            id: userData.id,
            role: userData.role,
            wallet: userData.walletAddress
          })
          setUser(userData)
        } else {
          console.log('[WebAuthInitializer] No active session')
          storeLogout()
        }
      } catch (error: any) {
        console.log('[WebAuthInitializer] Session check failed:', error.message)
        storeLogout()
      } finally {
        setLoading(false)
        console.log('[WebAuthInitializer] Initialization complete')
      }
    }

    initializeAuth()
  }, [])

  // This component doesn't render anything
  return null
}
