import type { Metadata } from 'next'
import { Web3Provider } from '@/components/providers/web3-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { NetworkStatus, AccessibilityPanel } from '@/components/lazy'
import { SkipToMain } from '@/components/ui/accessibility'
import ErrorBoundary from '@/components/ui/error-boundary'
import { StoreHydration } from '@/lib/store/hydration'
import './globals.css'

export const metadata: Metadata = {
  title: 'Heard Labs - Web3 Survey Platform',
  description: 'Earn crypto rewards by completing surveys on the Web3 platform',
  generator: 'Heard Labs',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
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
          <Web3Provider>
            <AuthProvider>
              <StoreHydration />
              <SkipToMain />
              <NetworkStatus />
              {children}
              <NotificationContainer />
              <AccessibilityPanel />
            </AuthProvider>
          </Web3Provider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
