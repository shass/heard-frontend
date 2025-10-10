'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/components/providers/auth-provider'
import { CreateSurveyModalProvider } from '@/components/providers/create-survey-modal-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { MiniKitReady } from '@/components/providers/minikit-ready'

interface BaseAppLayoutProps {
  children: ReactNode
}

export default function BaseAppLayout({ children }: BaseAppLayoutProps) {
  console.log('[BaseAppLayout] Rendering Base App layout')

  return (
    <AuthProvider>
      <CreateSurveyModalProvider>
        <NavigationProvider>
          <MiniKitReady />
          {children}
          <NotificationContainer />
        </NavigationProvider>
      </CreateSurveyModalProvider>
    </AuthProvider>
  )
}
