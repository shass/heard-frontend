'use client'

import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { usePlatformDetection } from './use-platform-detection'
import { useCallback, useMemo } from 'react'

interface MiniKitEnvironment {
  isMiniKit: boolean
  isBaseApp: boolean
  canUseAuthenticate: boolean
  shouldUseMiniKitAuth: boolean
}

export function useMiniKitEnvironment(): MiniKitEnvironment {
  const { isFrameReady } = useMiniKit()
  const platform = usePlatformDetection()

  const environment = useMemo(() => {
    // Проверяем если MiniKit готов и мы в мобильной среде
    const isMiniKit = isFrameReady && (platform.isMobile || platform.isIOS || platform.isAndroid)
    
    // Base App контекст определяется наличием MiniKit функциональности
    const isBaseApp = isMiniKit && typeof window !== 'undefined' && 
      (window.location.hostname.includes('base.org') || 
       window.location.hostname.includes('farcaster.xyz') ||
       // Проверяем user agent для Base/Farcaster приложений
       /Base|Farcaster|Warpcast/i.test(navigator.userAgent))
    
    // Можно использовать authenticate если MiniKit готов
    const canUseAuthenticate = isMiniKit
    
    // Должны использовать MiniKit аутентификацию если в Base App
    const shouldUseMiniKitAuth = isBaseApp || canUseAuthenticate

    return {
      isMiniKit,
      isBaseApp,
      canUseAuthenticate,
      shouldUseMiniKitAuth
    }
  }, [isFrameReady, platform])

  return environment
}

// Вспомогательный хук для проверки готовности к MiniKit аутентификации
export function useMiniKitAuthReady() {
  const { shouldUseMiniKitAuth, canUseAuthenticate } = useMiniKitEnvironment()
  
  const isReady = useCallback(() => {
    if (!shouldUseMiniKitAuth) return true // Обычный браузер всегда готов
    return canUseAuthenticate // MiniKit должен быть готов
  }, [shouldUseMiniKitAuth, canUseAuthenticate])
  
  return {
    isReady: isReady(),
    shouldUseMiniKitAuth,
    canUseAuthenticate
  }
}