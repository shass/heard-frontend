'use client'

import { ReactNode } from 'react'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/src/platforms/web/providers/Web3Provider'
import { CreateSurveyModalProvider } from '@/components/providers/create-survey-modal-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { NotificationContainer } from '@/components/ui/notifications'
import { MiniKitReady } from '@/src/platforms/base-app/components/MiniKitReady'
import { MiniKitBridge } from '@/src/platforms/_core/shared/providers/MiniKitBridgeProvider'

interface BaseAppLayoutProps {
  children: ReactNode
}

export default function BaseAppLayout({ children }: BaseAppLayoutProps) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY}
      chain={base}
      miniKit={{ enabled: true, autoConnect: true }}
    >
      <MiniKitBridge>
        <QueryClientProvider client={queryClient}>
          <CreateSurveyModalProvider>
            <NavigationProvider>
              <MiniKitReady />
              {children}
              <NotificationContainer />
            </NavigationProvider>
          </CreateSurveyModalProvider>
        </QueryClientProvider>
      </MiniKitBridge>
    </OnchainKitProvider>
  )
}
