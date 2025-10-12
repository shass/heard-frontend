'use client'

import { ReactNode, useRef } from 'react'
import { CreateSurveyModalProvider } from '@/components/providers/create-survey-modal-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { MiniKitReady } from '@/src/platforms/base-app/components/MiniKitReady'

interface BaseAppLayoutProps {
  children: ReactNode
}

export default function BaseAppLayout({ children }: BaseAppLayoutProps) {
  const renderCount = useRef(0)
  renderCount.current++
  console.log(`[BaseAppLayout] 🔄 Rendering Base App layout (render #${renderCount.current})`)

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
