'use client'

import { useEffect, useState } from 'react'
import { usePlatformDetector } from '@/src/platforms/PlatformDetectorProvider'

export function PlatformDebugBanner() {
  const [mounted, setMounted] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const { platform, isInitialized, isLoading } = usePlatformDetector()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if banner should be shown
    const shouldShow = process.env.NODE_ENV !== 'production' || localStorage.getItem('show_debug_banner')
    setShowBanner(!!shouldShow)

    if (!shouldShow) return

    try {
      const initInfo = localStorage.getItem('debug_platform_init')
      const detectedPlatform = localStorage.getItem('debug_detected_platform')

      setDebugInfo({
        initInfo: initInfo ? JSON.parse(initInfo) : null,
        detectedPlatform,
        currentPlatform: platform,
        isInitialized,
        isLoading
      })
    } catch (e) {
      console.error('Failed to read debug info:', e)
    }
  }, [mounted, platform, isInitialized, isLoading])

  // SSR safety - don't render on server
  if (!mounted || !showBanner) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000',
        color: '#0f0',
        padding: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 99999,
        maxHeight: '150px',
        overflow: 'auto'
      }}
      onClick={() => {
        // Click to copy debug info
        navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
        alert('Debug info copied to clipboard!')
      }}
    >
      <div><strong>🐛 Platform Debug (click to copy)</strong></div>
      <div>Platform: {platform || 'null'} | Init: {String(isInitialized)} | Loading: {String(isLoading)}</div>
      {debugInfo && (
        <>
          <div>clientFid: {debugInfo.initInfo?.clientFid || 'none'}</div>
          <div>hasContext: {String(debugInfo.initInfo?.hasContext)}</div>
          <div>Detected: {debugInfo.detectedPlatform || 'none'}</div>
        </>
      )}
    </div>
  )
}
