'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { useAuthSession } from '@/hooks/use-auth-session'

interface UseAuthEffectsProps {
  isConnected: boolean
  address: string | undefined
}

export function useAuthEffects({ isConnected, address }: UseAuthEffectsProps) {
  const { user } = useAuthStore()
  const { checkAuth, checkInitialAuth } = useAuthSession()
  const prevAddressRef = useRef<string | undefined>()

  /**
   * Auto-check auth on app load (if cookie exists)
   */
  useEffect(() => {
    checkInitialAuth().then()
  }, [])

  /**
   * Check auth when wallet address changes
   */
  useEffect(() => {
    // Only check if address actually changed (not just user object update)
    if (isConnected && address && address !== prevAddressRef.current) {
      prevAddressRef.current = address
      
      // Only re-check auth if user exists and wallet address doesn't match
      if (user && user.walletAddress &&
          user.walletAddress.toLowerCase() !== address.toLowerCase()) {
        checkAuth().then()
      }
    }
  }, [address, isConnected])
}
