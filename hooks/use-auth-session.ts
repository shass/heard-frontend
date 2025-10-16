'use client'

import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'

export function useAuthSession() {
  const {
    setUser,
    setLoading,
    logout: storeLogout
  } = useAuthStore()

  /**
   * Check authentication status - simply check if user has valid session
   */
  const checkAuth = async (): Promise<void> => {
    console.log('[AuthSession] Checking auth status')
    setLoading(true)
    try {
      const userData = await authApi.checkAuth()
      console.log('[AuthSession] Auth check result:', userData)
      if (userData) {
        console.log('[AuthSession] User authenticated, updating store')
        setUser(userData)
      } else {
        console.log('[AuthSession] No user data, logging out')
        storeLogout()
      }
    } catch (error: any) {
      console.error('[AuthSession] Auth check error:', error)
      storeLogout()
    } finally {
      setLoading(false)
    }
  }

  return {
    checkAuth
  }
}
