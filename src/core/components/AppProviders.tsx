'use client'

/**
 * AppProviders Component
 *
 * Handles sequential initialization of application providers
 * Ensures AppBootstrap completes before PlatformProvider starts
 */

import { useCallback, useState } from 'react'
import { AppBootstrap } from './AppBootstrap'
import { PlatformProvider } from '@/src/core/hooks/usePlatform'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [isBootstrapped, setBootstrapped] = useState(false)
  const handleReady = useCallback(() => setBootstrapped(true), [])

  return (
    <AppBootstrap onReady={handleReady}>
      {isBootstrapped ? (
        <PlatformProvider>{children}</PlatformProvider>
      ) : null}
    </AppBootstrap>
  )
}
