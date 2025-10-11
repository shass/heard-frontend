'use client'

import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'
import { useWebWallet } from '@/src/platforms/web/hooks/useWebWallet'
import { useBaseAppWallet } from '@/src/platforms/base-app/hooks/useBaseAppWallet'
import { useFarcasterWallet } from '@/src/platforms/farcaster/hooks/useFarcasterWallet'
import { Platform } from '@/src/platforms/config'

export function useCompatibleWallet() {
  const { platform } = usePlatformDetector()

  // Call all hooks (React rules)
  const webWallet = useWebWallet()
  const baseAppWallet = useBaseAppWallet()
  const farcasterWallet = useFarcasterWallet()

  // Select the appropriate wallet based on platform
  const wallet = (() => {
    switch (platform) {
      case Platform.BASE_APP:
        return baseAppWallet
      case Platform.FARCASTER:
        return farcasterWallet
      case Platform.WEB:
      default:
        return webWallet
    }
  })()

  return {
    isConnected: wallet?.isConnected || false,
    address: wallet?.address || null,
    isConnecting: wallet?.isLoading || false,
    connect: wallet?.connect || (async () => {}),
    disconnect: wallet?.disconnect || (async () => {}),
  }
}