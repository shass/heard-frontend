'use client'

import React from 'react'
import { usePlatform } from '@/src/platforms/PlatformContext'
import { WebLayout } from '@/src/platforms/web/layouts/WebLayout'
import BaseAppLayout from '@/src/platforms/base-app/layouts/BaseAppLayout'
import FarcasterLayout from '@/src/platforms/farcaster/layouts/FarcasterLayout'

interface PlatformAwareLayoutProps {
  children: React.ReactNode
}

export function PlatformAwareLayout({ children }: PlatformAwareLayoutProps) {
  const { platform } = usePlatform()

  switch (platform) {
    case 'base-app':
      return <BaseAppLayout>{children}</BaseAppLayout>
    case 'farcaster':
      return <FarcasterLayout>{children}</FarcasterLayout>
    case 'web':
    default:
      return <WebLayout>{children}</WebLayout>
  }
}

export function withPlatformLayout<T extends object>(
  Component: React.ComponentType<T>
) {
  return function PlatformLayoutWrappedComponent(props: T) {
    return (
      <PlatformAwareLayout>
        <Component {...props} />
      </PlatformAwareLayout>
    )
  }
}