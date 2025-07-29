'use client'

import { useEffect, useState } from 'react'

interface PlatformInfo {
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isDesktop: boolean
}

export function usePlatformDetection(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformInfo>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isDesktop: true,
  })

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    const isDesktop = !isMobile

    setPlatform({
      isMobile,
      isIOS,
      isAndroid,
      isDesktop,
    })
  }, [])

  return platform
}