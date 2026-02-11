'use client'

import { useMiniKitBridge } from '@/src/platforms/_core/shared/providers/MiniKitBridgeProvider'

/**
 * Platform-aware wrapper for MiniKit access.
 *
 * On MiniApp platforms (BaseApp/Farcaster), returns data from MiniKitBridge context
 * which is populated by a bridge provider inside OnchainKitProvider.
 * On Web platform, MiniKitBridge is not mounted — returns default null values.
 *
 * No conditional hooks — just useContext() under the hood.
 */
export function useSafeMiniKit() {
  return useMiniKitBridge()
}
