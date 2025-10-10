'use client'

import { usePlatform } from '@/src/platforms/PlatformContext'
import { useWebAuth } from '@/src/platforms/web/hooks/useWebAuth'
import { useBaseAppAuth } from '@/src/platforms/base-app/hooks/useBaseAppAuth'
import { useFarcasterAuth } from '@/src/platforms/farcaster/hooks/useFarcasterAuth'
import { AuthResult, AuthState } from '@/src/platforms/shared/interfaces/IAuthProvider'
import { Platform } from '@/src/platforms/config'

export function useAuthAdapter() {
  let platform: Platform | string | null = Platform.WEB
  let provider = null

  try {
    const platformContext = usePlatform()
    platform = platformContext.platform
    provider = platformContext.provider
  } catch (error) {
    // Fallback to web platform if context is not available
    platform = Platform.WEB
  }

  const webAuth = useWebAuth()
  const baseAppAuth = useBaseAppAuth()
  const farcasterAuth = useFarcasterAuth()

  const currentAuth = (() => {
    switch (platform) {
      case Platform.BASE_APP:
        return baseAppAuth
      case Platform.FARCASTER:
        return farcasterAuth
      case Platform.WEB:
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
    }
  }
}