'use client'

import { ReactNode } from 'react'
import { CreateSurveyModalProvider } from '@/components/providers/create-survey-modal-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { MiniKitReady } from '@/src/platforms/base-app/components/MiniKitReady'

interface FarcasterLayoutProps {
  children: ReactNode
}

export default function FarcasterLayout({ children }: FarcasterLayoutProps) {
  console.log('[FarcasterLayout] Rendering Farcaster layout')

  return (
    <CreateSurveyModalProvider>
      <NavigationProvider>
        <MiniKitReady />
        {children}
        <NotificationContainer />
      </NavigationProvider>
    </CreateSurveyModalProvider>
  )
}
