'use client'

import { useWallet } from '@/src/platforms/_core/hooks/useWallet'

/**
 * Compatibility wrapper for useWallet hook
 * @deprecated Use useWallet directly instead
 */
export function useCompatibleWallet() {
  const wallet = useWallet()

  return {
    isConnected: wallet.isConnected,
    address: wallet.address || null,
    isConnecting: wallet.isLoading,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
  }
}