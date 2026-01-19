'use client'

/**
 * Platform Layout Renderer
 *
 * Renders the active platform's layout component
 * Replaces the old PlatformLayoutSwitch
 */

import { ReactNode } from 'react'
import { usePlatform } from '@/src/core/hooks/usePlatform'

interface PlatformLayoutRendererProps {
  children: ReactNode
}

export function PlatformLayoutRenderer({ children }: PlatformLayoutRendererProps) {
  const { platform, isLoading, error } = usePlatform()

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Detecting platform...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Platform Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }

  if (!platform) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No platform detected</p>
      </div>
    )
  }

  // Get platform-specific layout component
  const Layout = platform.getLayout()

  return <Layout>{children}</Layout>
}
