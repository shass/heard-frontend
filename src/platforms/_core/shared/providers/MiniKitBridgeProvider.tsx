'use client'

import { createContext, useContext, useMemo, ReactNode } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import type { Context } from '@farcaster/miniapp-sdk'

type UseMiniKitReturn = ReturnType<typeof useMiniKit>

interface MiniKitBridgeValue {
  context: Context.MiniAppContext | null
  isMiniAppReady: boolean
  setMiniAppReady: UseMiniKitReturn['setMiniAppReady'] | null
  updateClientContext: UseMiniKitReturn['updateClientContext'] | null
  notificationProxyUrl: string | null
}

const defaultValue: MiniKitBridgeValue = {
  context: null,
  isMiniAppReady: false,
  setMiniAppReady: null,
  updateClientContext: null,
  notificationProxyUrl: null,
}

const MiniKitBridgeContext = createContext<MiniKitBridgeValue>(defaultValue)

/**
 * Bridge provider that reads OnchainKit's useMiniKit() and exposes values
 * via its own React context. Must be rendered inside OnchainKitProvider.
 *
 * This allows useSafeMiniKit to consume MiniKit data via useContext()
 * without conditional hook calls — solving the Rules of Hooks violation.
 */
export function MiniKitBridge({ children }: { children: ReactNode }) {
  const miniKit = useMiniKit()

  const value = useMemo<MiniKitBridgeValue>(() => ({
    context: miniKit.context,
    isMiniAppReady: miniKit.isMiniAppReady,
    setMiniAppReady: miniKit.setMiniAppReady,
    updateClientContext: miniKit.updateClientContext,
    notificationProxyUrl: miniKit.notificationProxyUrl,
  }), [miniKit.context, miniKit.isMiniAppReady, miniKit.setMiniAppReady, miniKit.updateClientContext, miniKit.notificationProxyUrl])

  return (
    <MiniKitBridgeContext.Provider value={value}>
      {children}
    </MiniKitBridgeContext.Provider>
  )
}

/**
 * Read MiniKit values from the bridge context.
 * Returns null defaults when outside OnchainKitProvider tree (Web platform).
 */
export function useMiniKitBridge(): MiniKitBridgeValue {
  return useContext(MiniKitBridgeContext)
}
