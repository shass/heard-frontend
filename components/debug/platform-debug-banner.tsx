'use client'

import { useEffect, useState } from 'react'
import { usePlatform } from '@/src/platforms/PlatformContext'

export function PlatformDebugBanner() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { platform, isInitialized, isLoading } = usePlatform()

  useEffect(() => {
    // Read localStorage debug info
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
  }, [platform, isInitialized, isLoading])

  // Only show in development or if debug flag is set
  if (process.env.NODE_ENV === 'production' && !localStorage.getItem('show_debug_banner')) {
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
