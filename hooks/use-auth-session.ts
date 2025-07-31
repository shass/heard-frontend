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
  const checkAuth = async () => {
    setLoading(true)
    try {
      const userData = await authApi.checkAuth()
      if (userData) {
        setUser(userData)
      } else {
        storeLogout()
      }
    } catch (error: any) {
      storeLogout()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check auth on app load using HttpOnly cookie
   */
  const checkInitialAuth = async () => {
    await checkAuth()
  }

  return {
    checkAuth,
    checkInitialAuth
  }
}
