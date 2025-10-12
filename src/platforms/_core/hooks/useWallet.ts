'use client'

import { usePlatformDetector } from '../PlatformDetectorProvider'
import { Platform } from '../../config'
import { IWalletStrategy } from '../shared/interfaces/IWalletStrategy'

export function useWallet(): IWalletStrategy {
  const { platform } = usePlatformDetector()

  // Strategy pattern: select implementation BEFORE calling any hooks
  // This ensures wagmi hooks are NEVER called in Base App or Farcaster
  switch (platform) {
    case Platform.WEB: {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useWebWalletStrategy } = require('@/src/platforms/web/strategies/useWebWalletStrategy')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useWebWalletStrategy()
    }

    case Platform.BASE_APP:
    case Platform.FARCASTER:
    default: {
      // Base App and Farcaster don't have wallet strategy yet
      // Return stub implementation
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
