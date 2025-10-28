'use client'

import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { FARCASTER_CLIENT_FID } from '../../config'

export interface MiniKitContext {
  isBaseApp: boolean
  isFarcasterApp: boolean
  isWebsite: boolean
  clientFid?: number
  context?: any // OnchainKit MiniKit context type
}

/**
 * Hook to detect platform based on MiniKit context
 *
 * SECURITY WARNING:
 * - Context data is UNVERIFIED and can be spoofed
 * - Use ONLY for UI decisions (which components to show)
 * - Never use for authorization or security decisions
 * - Backend must verify all security-critical operations
 *
 * @see https://docs.base.org/mini-apps/security
 */
export function useMiniKitContext(): MiniKitContext {
  const { context } = useMiniKit()

  if (!context) {
    return {
      isBaseApp: false,
      isFarcasterApp: false,
      isWebsite: true,
      context: undefined,
    }
  }

  const clientFid = (context.client as any)?.clientFid
  const clientFidStr = String(clientFid ?? '')

  // Check for Base App by clientFid (unverified - UI only)
  const isBaseApp = clientFidStr === FARCASTER_CLIENT_FID.BASE_APP

  // Check for Farcaster by clientFid (unverified - UI only)
  const isFarcasterApp = clientFidStr === FARCASTER_CLIENT_FID.FARCASTER

  const isWebsite = !isBaseApp && !isFarcasterApp

  return {
    isBaseApp,
    isFarcasterApp,
    isWebsite,
    clientFid: clientFid ? Number(clientFid) : undefined,
    context, // Unverified context for UI only
  }
}
