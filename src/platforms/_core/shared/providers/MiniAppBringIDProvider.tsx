'use client'

import { useCallback, useState, useEffect } from 'react'
import { BringIDModal } from 'bringid/react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAuthStore } from '@/lib/store'
import { env } from '@/lib/env'

interface MiniAppBringIDProviderProps {
  children: React.ReactNode
}

/**
 * BringID Provider for MiniApp platforms (Base App, Farcaster).
 * Uses Farcaster MiniApp SDK for wallet address and message signing,
 * instead of wagmi hooks used by the Web BringIDProvider.
 */
export function MiniAppBringIDProvider({ children }: MiniAppBringIDProviderProps) {
  const user = useAuthStore(state => state.user)
  const [sdkAddress, setSdkAddress] = useState<string | undefined>(undefined)

  // Try to get address from SDK on mount and when user changes
  useEffect(() => {
    let cancelled = false

    sdk.wallet.getEthereumProvider()
      .then(provider => {
        if (!provider || cancelled) return
        return provider.request({ method: 'eth_accounts' })
      })
      .then(accounts => {
        if (!cancelled && accounts?.[0]) {
          setSdkAddress(accounts[0])
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [user])

  // Use SDK address or fall back to auth store
  const address = sdkAddress || user?.walletAddress

  const generateSignature = useCallback(
    async (message: string) => {
      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider || !address) {
        throw new Error('Wallet not available for signing')
      }

      const signature = await provider.request({
        method: 'personal_sign',
        params: [message as `0x${string}`, address as `0x${string}`]
      }) as string

      return signature
    },
    [address]
  )

  return (
    <>
      <BringIDModal
        mode={env.BRINGID_MODE}
        address={address}
        generateSignature={generateSignature}
      />
      {children}
    </>
  )
}
