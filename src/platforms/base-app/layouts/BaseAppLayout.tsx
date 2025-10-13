'use client'

import { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/src/platforms/web/providers/Web3Provider'
import { CreateSurveyModalProvider } from '@/components/providers/create-survey-modal-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { MiniKitReady } from '@/src/platforms/base-app/components/MiniKitReady'

interface BaseAppLayoutProps {
  children: ReactNode
}

export default function BaseAppLayout({ children }: BaseAppLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CreateSurveyModalProvider>
        <NavigationProvider>
          <MiniKitReady />
          {children}
          <NotificationContainer />
        </NavigationProvider>
      </CreateSurveyModalProvider>
    </QueryClientProvider>
  )
}
