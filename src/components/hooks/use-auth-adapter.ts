'use client'

import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'
import { useWebAuth } from '@/src/platforms/web/hooks/useWebAuth'
import { useBaseAppAuth } from '@/src/platforms/base-app/hooks/useBaseAppAuth'
import { useFarcasterAuth } from '@/src/platforms/farcaster/hooks/useFarcasterAuth'
import { AuthResult } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { Platform } from '@/src/platforms/config'

export function useAuthAdapter() {
  const { platform } = usePlatformDetector()

  // Always call all hooks (React rules), but only use the one for current platform
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