'use client'

import { useConfig } from 'wagmi'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { useMobileWallet } from '@/hooks/use-mobile-wallet'
import { useCacheWarmer } from '@/hooks/use-cache-warmer'

export function useAuthLogin() {
  const config = useConfig()
  const { setUser, setLoading, setError } = useAuthStore()
  const mobileWallet = useMobileWallet()
  const { warmAuthenticated } = useCacheWarmer()

  /**
   * Login with wallet signature
   */
  const login = async (isConnected: boolean, address: string | undefined) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // Import signMessage dynamically to avoid SSR issues
      const { signMessage } = await import('wagmi/actions')
      
      // Step 1: Get nonce from backend
      console.log('Step 1: Getting nonce for address:', address)
      const { nonce, message } = await authApi.getNonce(address)
      console.log('Step 1 complete: Got nonce', nonce)

      // Step 2: Sign message with wallet
      console.log('Step 2: Signing message with wallet')
      mobileWallet.setIsWaitingForSignature(true)
      
      let signature: string
      
      try {
        // For mobile devices, start polling as backup
        if (mobileWallet.isMobile) {
          const platform = mobileWallet.isIOS ? 'iOS' : mobileWallet.isAndroid ? 'Android' : 'Mobile'
          console.log(`🔄 ${platform} detected, starting backup polling`)
          mobileWallet.startAuthPolling(() => {
            // Warm cache for new authenticated user
            warmAuthenticated().catch(error => 
              console.warn('Failed to warm cache after polling auth:', error)
            )
          })
        }
        
        // Add shorter timeout for mobile browsers with better messaging
        signature = await Promise.race([
          signMessage(config, { message }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Signing timeout - please check your wallet app and try again. If you already signed, the app will detect it automatically.')), 30000)
          )
        ])
        
        // If we got signature normally, stop polling
        mobileWallet.stopAuthPolling()
        mobileWallet.setIsWaitingForSignature(false)
        
      } catch (error: any) {
        // If signing failed but we're polling on mobile, let polling handle it
        if (mobileWallet.isMobile) {
          const platform = mobileWallet.isIOS ? 'iOS' : mobileWallet.isAndroid ? 'Android' : 'Mobile'
          console.log(`📱 Signature failed on ${platform} - attempting mobile polling fallback`)
          console.log('Error details:', error.message)
          
          // Use the mobile polling promise
          try {
            await mobileWallet.startMobileAuthPolling()
            // If we reach here, auth succeeded via polling
            console.log(`✅ Authentication completed via ${platform} polling fallback`)
            
            // Warm cache for new authenticated user
            warmAuthenticated().catch(error => 
              console.warn('Failed to warm cache after polling auth:', error)
            )
            return // Skip the rest of the normal flow
          } catch (pollError: any) {
            console.error('❌ Mobile polling also failed:', pollError.message)
            throw new Error(`Authentication failed: ${pollError.message}`)
          }
        } else {
          mobileWallet.stopAuthPolling()
          mobileWallet.setIsWaitingForSignature(false)
          console.error('❌ Signature failed on desktop device:', error.message)
          throw error
        }
      }
      
      console.log('Step 2 complete: Got signature', signature)

      // Step 3: Send signature to backend for verification
      console.log('Step 3: Sending signature to backend for verification')
      const { user: userData } = await authApi.connectWallet({
        walletAddress: address,
        signature,
        message,
      })
      console.log('Step 3 complete: Got user data', userData)

      // Step 4: Update store with user data
      console.log('Step 4: Updating store with user data')
      setUser(userData)
      console.log('Login successful! Token stored as HttpOnly cookie by backend.')
      
      // Step 5: Warm cache for new authenticated user
      console.log('Step 5: Warming cache for authenticated user')
      warmAuthenticated().catch(error => 
        console.warn('Failed to warm cache after login:', error)
      )
      
    } catch (error: any) {
      console.error('Login failed at step:', error)
      setError(error.message || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    login
  }
}