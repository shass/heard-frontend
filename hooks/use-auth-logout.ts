'use client'

import { useConfig } from 'wagmi'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { useCacheWarmer } from '@/hooks/use-cache-warmer'

export function useAuthLogout() {
  const config = useConfig()
  const { isAuthenticated, setLoading, logout: storeLogout } = useAuthStore()
  const { clearAuthCache } = useCacheWarmer()

  /**
   * Logout and disconnect wallet
   */
  const logout = async () => {
    setLoading(true)
    
    try {
      // Notify backend about logout
      if (isAuthenticated) {
        await authApi.disconnect()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }

    // Clear local state
    storeLogout()
    
    // Clear auth-specific cache
    clearAuthCache()
    
    // Disconnect wallet
    try {
      const { disconnect } = await import('wagmi/actions')
      disconnect(config)
    } catch (error) {
      console.error('Wallet disconnect error:', error)
    }
    
    setLoading(false)
  }

  return {
    logout
  }
}