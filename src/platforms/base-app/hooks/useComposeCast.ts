'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import type { ComposeCast } from '@farcaster/miniapp-core'

/**
 * Hook to compose casts in Base App / Farcaster
 * Wrapper around sdk.actions.composeCast
 */
export function useComposeCast() {
  const composeCast = async (options?: ComposeCast.Options) => {
    try {
      return await sdk.actions.composeCast(options)
    } catch (error) {
      console.error('[useComposeCast] Error composing cast:', error)
      throw error
    }
  }

  return { composeCast }
}
