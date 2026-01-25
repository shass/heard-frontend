'use client'

/**
 * AppProviders Component
 *
 * Handles sequential initialization of application providers
 * Ensures AppBootstrap completes before PlatformProvider starts
 */

import { useState } from 'react'
import { AppBootstrap } from './AppBootstrap'
import { PlatformProvider } from '@/src/core/hooks/usePlatform'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [isBootstrapped, setBootstrapped] = useState(false)

  return (
    <AppBootstrap onReady={() => setBootstrapped(true)}>
      {isBootstrapped ? (
        <PlatformProvider>{children}</PlatformProvider>
      ) : null}
    </AppBootstrap>
  )
}
