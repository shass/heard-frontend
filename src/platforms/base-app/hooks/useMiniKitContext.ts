'use client'

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Context } from '@farcaster/miniapp-sdk'
import { FARCASTER_CLIENT_FID } from '../../config'

export interface MiniKitContext {
  isBaseApp: boolean
  isFarcasterApp: boolean
  isWebsite: boolean
  clientFid?: number
  context?: Context.MiniAppContext
}

export function useMiniKitContext(): MiniKitContext {
  const [context, setContext] = useState<Context.MiniAppContext | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    sdk.context.then((ctx) => {
      setContext(ctx)
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })
  }, [])

  if (isLoading || !context) {
    return {
      isBaseApp: false,
      isFarcasterApp: false,
      isWebsite: true,
      context: undefined,
    }
  }

  const clientFid = (context.client as any)?.clientFid
  const clientFidStr = String(clientFid ?? '')

  // Check for Base App by clientFid
  const isBaseApp = clientFidStr === FARCASTER_CLIENT_FID.BASE_APP

  // Check for Farcaster by clientFid
  const isFarcasterApp = clientFidStr === FARCASTER_CLIENT_FID.FARCASTER

  const isWebsite = !isBaseApp && !isFarcasterApp

  return {
    isBaseApp,
    isFarcasterApp,
    isWebsite,
    clientFid: clientFid ? Number(clientFid) : undefined,
    context,
  }
}
