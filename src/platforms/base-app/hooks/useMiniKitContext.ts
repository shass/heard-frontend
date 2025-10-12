'use client'

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Context } from '@farcaster/miniapp-sdk'

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
  const clientFidStr = clientFid?.toString()

  // Check for Base App by clientFid
  const isBaseApp = clientFidStr === '309857'

  // Check for Farcaster by clientFid
  const isFarcasterApp = clientFidStr === '1'

  const isWebsite = !isBaseApp && !isFarcasterApp

  return {
    isBaseApp,
    isFarcasterApp,
    isWebsite,
    clientFid: clientFid ? Number(clientFid) : undefined,
    context,
  }
}
