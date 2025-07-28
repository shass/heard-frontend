'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { useAuthSession } from '@/hooks/use-auth-session'

interface UseAuthEffectsProps {
  isConnected: boolean
  address: string | undefined
}

export function useAuthEffects({ isConnected, address }: UseAuthEffectsProps) {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAuthStore()
  const { checkAuth, checkInitialAuth } = useAuthSession()

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
    console.log('🔄 Wallet connection changed:', { isConnected, address, isAuthenticated })
    
    if (isConnected && address) {
      console.log('🔄 Wallet connected, running checkAuth for:', address)
      checkAuth(isConnected, address)
    } else if (!isConnected && isAuthenticated) {
      console.log('🔄 Wallet disconnected but user authenticated, logging out')
      storeLogout()
    } else {
      console.log('🔄 No action needed')
    }
  }, [isConnected, address])

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