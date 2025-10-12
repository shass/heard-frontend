'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import type { SignIn } from '@farcaster/miniapp-core'

/**
 * Hook to authenticate users in Base App / Farcaster
 * Wrapper around sdk.actions.signIn
 */
export function useAuthenticate() {
  const signIn = async (options?: SignIn.SignInOptions) => {
    try {
      return await sdk.actions.signIn(options)
    } catch (error) {
      console.error('[useAuthenticate] Error signing in:', error)
      throw error
    }
  }

  return { signIn }
}
