'use client'

import { usePlatformDetector, IWalletStrategy } from '@/src/platforms'
import { Platform } from '../../config'

export function useWallet(): IWalletStrategy {
  const { platform } = usePlatformDetector()

  // Strategy pattern: select implementation BEFORE calling any hooks
  // This ensures wagmi hooks are NEVER called in Base App or Farcaster
  switch (platform) {
    case Platform.WEB: {
      const { useWebWalletStrategy } = require('@/src/platforms/web/strategies/useWebWalletStrategy')
      return useWebWalletStrategy()
    }

    case Platform.BASE_APP: {
      const { useBaseAppWalletStrategy } = require('@/src/platforms/base-app/strategies/useBaseAppWalletStrategy')
      return useBaseAppWalletStrategy()
    }

    case Platform.FARCASTER:
    default: {
      // Farcaster doesn't have wallet strategy yet - return stub
      return {
        address: undefined,
        isConnected: false,
        chainId: undefined,
        balance: undefined,
        isLoading: false,
        error: null,
        connect: async () => {},
        disconnect: async () => {},
        signMessage: async () => { throw new Error('Not implemented') },
        sendTransaction: async () => { throw new Error('Not implemented') },
        getConnectors: () => [],
        canConnect: false,
        canSignMessage: false,
        canSendTransaction: false,
      }
    }
  }
}
