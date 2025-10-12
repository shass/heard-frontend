'use client'

import { usePlatformDetector } from '../PlatformDetectorProvider'
import { Platform } from '../../config'
import { IAuthStrategy } from '../shared/interfaces/IAuthStrategy'

export function useAuth(): IAuthStrategy {
  const { platform } = usePlatformDetector()

  // Strategy pattern: select implementation BEFORE calling any hooks
  // This ensures wagmi hooks are NEVER called in Base App or Farcaster
  switch (platform) {
    case Platform.WEB: {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useWebAuthStrategy } = require('@/src/platforms/web/strategies/useWebAuthStrategy')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useWebAuthStrategy()
    }

    case Platform.BASE_APP: {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useBaseAppAuthStrategy } = require('@/src/platforms/base-app/strategies/useBaseAppAuthStrategy')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useBaseAppAuthStrategy()
    }

    case Platform.FARCASTER: {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useFarcasterAuthStrategy } = require('@/src/platforms/farcaster/strategies/useFarcasterAuthStrategy')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useFarcasterAuthStrategy()
    }

    default: {
      // Fallback to Web strategy
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useWebAuthStrategy } = require('@/src/platforms/web/strategies/useWebAuthStrategy')
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useWebAuthStrategy()
    }
  }
}
