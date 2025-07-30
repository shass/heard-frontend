'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { useAuthSession } from '@/hooks/use-auth-session'

interface UseAuthEffectsProps {
  isConnected: boolean
  address: string | undefined
}

export function useAuthEffects({ isConnected, address }: UseAuthEffectsProps) {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAuthStore()
  const { checkAuth, checkInitialAuth } = useAuthSession()
  const prevConnectionState = useRef<{ isConnected: boolean; address: string | undefined }>({
    isConnected: false,
    address: undefined
  })

  /**
   * Auto-check auth on app load (if cookie exists)
   */
  useEffect(() => {
    // Only check once on mount, regardless of wallet connection
    // This will use the HttpOnly cookie if available
    checkInitialAuth()
  }, []) // Run only once on mount

  /**
   * Auto-check auth when wallet connection changes
   */
  useEffect(() => {
    const prev = prevConnectionState.current

    // Determine the type of change
    const wasConnected = prev.isConnected
    const nowConnected = isConnected
    const addressChanged = prev.address !== address

    if (nowConnected && address) {
      // Wallet is connected - check auth if needed
      if (!wasConnected || addressChanged) {
        checkAuth(isConnected, address).then()
      }
    } else if (wasConnected && !nowConnected && isAuthenticated) {
      // This is a real disconnect (was connected, now not connected)
      // Only logout if we were previously in a fully connected state
      if (prev.address) {
        storeLogout()
      }
    } else {
      console.log('🔄 No action needed (likely initialization)')
    }

    // Update previous state
    prevConnectionState.current = { isConnected, address }
  }, [isConnected, address, isAuthenticated])

  /**
   * Handle wallet address changes
   */
  useEffect(() => {
    if (isAuthenticated && user && user.walletAddress && address &&
        user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      console.log('Wallet address changed - user needs to re-authenticate')
      console.log('Previous:', user.walletAddress, 'Current:', address)

      // Clear user state but don't call logout API since session might be valid for original address
      setUser(null)
      // The UI will show "Connect Wallet" button for the new address
    }
  }, [address, user, isAuthenticated])
}
