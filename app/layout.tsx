import type { Metadata } from 'next'
import ErrorBoundary from '@/components/ui/error-boundary'
import { PlatformDebugBanner } from '@/components/debug/platform-debug-banner'
import { PlatformDetectorProvider } from '@/src/platforms/_core/PlatformDetectorProvider'
import { MiniKitContextProvider } from '@/src/platforms/base-app/providers/MiniKitProvider'
import { PlatformLayoutSwitch } from '@/src/platforms/_core/components/PlatformLayoutSwitch'
import { env } from '@/lib/env'
import './globals.css'
import React from 'react';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(env.PUBLIC_URL || ''),
  title: 'HEARD - Everyone Will Be HEARD',
  description: 'Surveys gated by verified Web2 & Web3 behavior. Earn crypto rewards for your opinions.',
  category: 'Social',
  openGraph: {
    title: 'HEARD - Everyone Will Be HEARD',
    description: 'Surveys gated by verified Web2 & Web3 behavior. Earn crypto rewards for your opinions.',
    url: env.PUBLIC_URL,
    siteName: 'HEARD',
    images: [
      {
        url: '/hero-1200x630.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEARD - Everyone Will Be HEARD',
    description: 'Surveys gated by verified Web2 & Web3 behavior. Earn crypto rewards for your opinions.',
    images: ['/hero-1200x630.png'],
  },
  other: {
    // Farcaster Frame embed metadata for sharing
    'fc:frame': 'vNext',
    'fc:frame:image': `${env.PUBLIC_URL}/hero-1200x630.png`,
    'fc:frame:button:1': 'Start Survey',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': env.PUBLIC_URL || '',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <MiniKitContextProvider>
            <PlatformDetectorProvider>
              {/* Debug tools - общие для всех платформ */}
              <PlatformDebugBanner />
              {/*<MobileDevTools />*/}

              {/* Platform-specific layout switch */}
              <PlatformLayoutSwitch>
                {children}
              </PlatformLayoutSwitch>
            </PlatformDetectorProvider>
          </MiniKitContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
