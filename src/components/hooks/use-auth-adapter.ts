'use client'

import { usePlatform } from '@/src/platforms/PlatformContext'
import { useWebAuth } from '@/src/platforms/web/hooks/useWebAuth'
import { useBaseAppAuth } from '@/src/platforms/base-app/hooks/useBaseAppAuth'  
import { useFarcasterAuth } from '@/src/platforms/farcaster/hooks/useFarcasterAuth'
import { AuthResult, AuthState } from '@/src/platforms/shared/interfaces/IAuthProvider'

export function useAuthAdapter() {
  let platform = 'web', provider = null
  
  try {
    const platformContext = usePlatform()
    platform = platformContext.platform
    provider = platformContext.provider
  } catch (error) {
    // Fallback to web platform if context is not available
    platform = 'web'
  }
  
  const webAuth = useWebAuth()
  const baseAppAuth = useBaseAppAuth()
  const farcasterAuth = useFarcasterAuth()

  const currentAuth = (() => {
    switch (platform) {
      case 'base-app':
        return baseAppAuth
      case 'farcaster':
        return farcasterAuth
      case 'web':
      default:
        return webAuth
    }
  })()

  return {
    canAuthenticate: currentAuth?.canAuthenticate || false,
    isAuthenticated: currentAuth?.isAuthenticated || false,
    user: currentAuth?.user || null,
    isLoading: currentAuth?.isLoading || false,
    error: currentAuth?.error || null,
    authenticate: async (): Promise<AuthResult> => {
      if (!currentAuth?.authenticate) {
        throw new Error(`Authentication not available for platform: ${platform}`)
      }
      return await currentAuth.authenticate()
    },
    logout: async (): Promise<void> => {
      if (currentAuth?.logout) {
        await currentAuth.logout()
      }
    },
    checkAuthStatus: async (): Promise<void> => {
      if (currentAuth?.checkAuthStatus) {
        await currentAuth.checkAuthStatus()
      }
    },
    getWalletAddress: (): string | null => {
      return currentAuth?.getWalletAddress?.() || null
    }
  }
}