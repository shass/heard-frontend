/**
 * BringID SDK Instance
 *
 * Lazy singleton — created on first use so the active platform is already known.
 * Provides platform-specific redirectUrl for mini-app OAuth flows.
 */

import { BringID } from 'bringid'
import { env } from '@/lib/env'
import { platformRegistry } from '@/src/core/registry/PlatformRegistry'

const REDIRECT_URLS: Record<string, string> = {
  'farcaster': 'https://farcaster.xyz/miniapps/YCvLLBYhmrcE/heard-labs',
  'base-app': 'https://base.app/app/heardlabs.xyz',
}

let instance: BringID | null = null

export function getBringId(): BringID {
  if (!instance) {
    let redirectUrl = env.PUBLIC_URL || 'https://heardlabs.xyz'
    try {
      const platformId = platformRegistry.getActive().id
      redirectUrl = REDIRECT_URLS[platformId] || redirectUrl
    } catch {
      // Platform not yet detected — use default
    }
    instance = new BringID({ appId: env.BRINGID_APP_ID, mode: env.BRINGID_MODE, redirectUrl })
  }
  return instance
}
