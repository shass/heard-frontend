'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import type { SignIn } from '@farcaster/miniapp-sdk'

/**
 * Hook to authenticate users in Base App / Farcaster
 * Wrapper around sdk.actions.signIn
 */
export function useAuthenticate() {
  const signIn = async (options?: SignIn.SignInOptions) => {
    try {
      const signInOptions = options || { nonce: crypto.randomUUID() }
      return await sdk.actions.signIn(signInOptions)
    } catch (error) {
      console.error('[useAuthenticate] Error signing in:', error)
      throw error
    }
  }

  return { signIn }
}
