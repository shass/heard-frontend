'use client'

import { ReactNode } from 'react'
import { Web3Provider } from '@/src/platforms/web/providers/Web3Provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { CreateSurveyModalProvider } from '@/components/providers/create-survey-modal-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { NetworkStatus } from '@/components/lazy'

interface WebLayoutProps {
  children: ReactNode
}

export default function WebLayout({ children }: WebLayoutProps) {
  console.log('[WebLayout] Rendering Web layout')

  return (
    <Web3Provider>
      <AuthProvider>
        <CreateSurveyModalProvider>
          <NavigationProvider>
            <NetworkStatus />
            {children}
            <NotificationContainer />
          </NavigationProvider>
        </CreateSurveyModalProvider>
      </AuthProvider>
    </Web3Provider>
  )
}
