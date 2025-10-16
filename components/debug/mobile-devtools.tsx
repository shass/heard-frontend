'use client'

import { useEffect, useRef } from 'react'
import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'

export function MobileDevTools() {
  const { platform, isInitialized } = usePlatformDetector()
  const isInitializedRef = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (isInitializedRef.current) return

    // Only load in development or when explicitly enabled
    const shouldLoadDevTools =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_MOBILE_DEVTOOLS === 'true'

    if (!shouldLoadDevTools) return

    // Check if Eruda is already loaded
    // @ts-ignore
    if (window.eruda) {
      console.log('[MobileDevTools] Eruda already loaded, skipping initialization')
      isInitializedRef.current = true
      return
    }

    // Mark as initialized to prevent double load
    isInitializedRef.current = true

    // Load Eruda from CDN
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/eruda'
    script.onload = () => {
      // @ts-ignore - Eruda is loaded from CDN
      if (window.eruda) {
        // @ts-ignore
        window.eruda.init()

        console.log('%c📱 HEARD Mobile DevTools', 'font-size: 20px; font-weight: bold; color: #00ff88;')
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff88;')
        console.log('%c✅ Eruda DevTools активированы!', 'font-size: 14px; color: #00ff88;')
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff88;')
      }
    }
    document.body.appendChild(script)
  }, []) // Пустой массив зависимостей - выполнится только один раз

  // Separate effect to log platform when it's finally determined
  useEffect(() => {
    if (isInitialized && platform) {
      // Wait a bit to ensure it logs after other detection logs
      setTimeout(() => {
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff88;')
        console.log('%c🎯 Определенная платформа:', 'font-size: 14px; font-weight: bold; color: #ffaa00;')
        console.log(`%c   Platform: ${platform}`, 'font-size: 14px; color: #ffaa00;')
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff88;')
        console.log('')
      }, 50)
    }
  }, [isInitialized, platform])

  return null
}
