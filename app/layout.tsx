import type { Metadata } from 'next'
import { Web3Provider } from '@/components/providers/web3-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { CreateSurveyModalProvider } from '@/components/providers/create-survey-modal-provider'
import { MiniKitContextProvider } from '@/components/providers/minikit-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { NetworkStatus } from '@/components/lazy'
import ErrorBoundary from '@/components/ui/error-boundary'
import { StoreHydration } from '@/lib/store/hydration'
import './globals.css'
import React from 'react';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Heard Labs - Web3 Survey Platform',
  description: 'Earn crypto rewards by completing surveys on the Web3 platform',
  generator: 'Heard Labs',
  openGraph: {
    title: 'Heard Labs',
    description: 'Earn crypto rewards by completing surveys on the Web3 platform',
    url: 'https://heardlabs.xyz',
    siteName: 'Heard Labs',
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
    title: 'Heard Labs',
    description: 'Earn crypto rewards by completing surveys on the Web3 platform',
    images: ['/hero-1200x628.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://heardlabs.xyz/hero-1200x628.png',
    'fc:frame:button:1': 'Open App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://heardlabs.xyz',
    'og:image': 'https://heardlabs.xyz/hero-1200x628.png',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
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
            <Web3Provider>
              <AuthProvider>
                <CreateSurveyModalProvider>
                  <StoreHydration />
                  <NetworkStatus />
                  {children}
                  <NotificationContainer />
                </CreateSurveyModalProvider>
              </AuthProvider>
            </Web3Provider>
          </MiniKitContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
