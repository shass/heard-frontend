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
  const { checkAuth } = useAuthSession()
  const prevAddressRef = useRef<string | undefined>(undefined)

  /**
   * Auto-check auth on app load (if cookie exists)
   */
  useEffect(() => {
    checkAuth().then()
  }, [])

  /**
   * Check auth when wallet address changes
   */
  useEffect(() => {
    // Only check if address actually changed and user exists with different wallet
    if (isConnected && address && address !== prevAddressRef.current && 
        user?.walletAddress && user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      prevAddressRef.current = address
      checkAuth().then()
    }
  }, [address, isConnected, user?.walletAddress])
}
