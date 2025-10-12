import type { Metadata } from 'next'
import ErrorBoundary from '@/components/ui/error-boundary'
import { MobileDevTools } from '@/components/debug/mobile-devtools'
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
  title: 'Heard - Web3 Survey Platform',
  description: 'Earn crypto rewards by completing surveys on the Web3 platform',
  category: 'Social',
  generator: 'Heard',
  openGraph: {
    title: 'Heard',
    description: 'Earn crypto rewards by completing surveys on the Web3 platform',
    url: 'https://heardlabs.xyz',
    siteName: 'Heard',
    images: [
      {
        url: '/hero-1200x628.png',
        width: 1200,
        height: 628,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heard',
    description: 'Earn crypto rewards by completing surveys on the Web3 platform',
    images: ['/hero-1200x628.png'],
  },
  other: {
    // Farcaster Mini App metadata
    // 'fc:miniapp': JSON.stringify({
    //   version: '1',
    //   imageUrl: 'https://heardlabs.xyz/hero-1200x628.png',
    //   button: {
    //     title: 'Open Heard',
    //     action: {
    //       type: 'launch_miniapp'
    //     }
    //   },
    //   splashImageUrl: 'https://heardlabs.xyz/hero-banner.png',
    //   splashBackgroundColor: '#ffffff'
    // }),
    // Farcaster Frame metadata
    // 'fc:frame': 'vNext',
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: 'https://heardlabs.xyz/hero-1200x628.png',
      button: {
        title: 'Open Heard',
        action: {
          type: 'launch_miniapp'
        }
      },
      splashImageUrl: 'https://heardlabs.xyz/hero-banner.png',
      splashBackgroundColor: '#ffffff'
    }),
    'fc:frame:image': 'https://heardlabs.xyz/hero-1200x628.png',
    'fc:frame:button:1': 'Open App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://heardlabs.xyz',
    // OpenGraph fallback
    'og:image': 'https://heardlabs.xyz/hero-1200x628.png',
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
              <MobileDevTools />

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
