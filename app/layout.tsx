import type { Metadata } from 'next'
import ErrorBoundary from '@/components/ui/error-boundary'
import { AppProviders } from '@/src/core/components/AppProviders'
import { PlatformLayoutRenderer } from '@/src/core/components/PlatformLayoutRenderer'
import { env } from '@/lib/env'
import './globals.css'
import React from 'react'

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
    // Farcaster Mini App metadata for sharing
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${env.PUBLIC_URL}/hero-1200x630.png`,
      button: {
        title: 'Open HEARD',
        action: {
          type: 'launch_frame',
          name: 'Heard',
          url: env.PUBLIC_URL || '',
        },
      },
    }),
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
          <AppProviders>
            {/* Platform-specific layout renderer */}
            <PlatformLayoutRenderer>
              {children}
            </PlatformLayoutRenderer>
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}
