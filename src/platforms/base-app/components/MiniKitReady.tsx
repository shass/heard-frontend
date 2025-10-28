'use client';

import { useMiniKitReady } from '@/src/platforms/base-app/hooks/useMiniKitReady';

/**
 * Component that initializes OnchainKit MiniKit on mount
 * Calls setMiniAppReady() to hide splash screen and signal app is ready
 *
 * Must be rendered in Base App / Farcaster layouts
 */
export function MiniKitReady() {
  useMiniKitReady();

  return null;
}
