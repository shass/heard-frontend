'use client'

import { ReactNode } from 'react'
import { Web3Provider } from '@/src/platforms/web/providers/Web3Provider'
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
      <CreateSurveyModalProvider>
        <NavigationProvider>
          <NetworkStatus />
          {children}
          <NotificationContainer />
        </NavigationProvider>
      </CreateSurveyModalProvider>
    </Web3Provider>
  )
}
