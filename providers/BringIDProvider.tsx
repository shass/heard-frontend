'use client'

import { BringIDModal } from 'bringid/react'
import { useAccount, useWalletClient } from 'wagmi'

interface BringIDProviderProps {
  children: React.ReactNode
}

/**
 * BringID Provider Component
 *
 * Wraps children with BringIDModal for identity verification UI.
 * Requires wagmi's WagmiProvider to be mounted above this component.
 */
export function BringIDProvider({ children }: BringIDProviderProps) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()

  return (
    <>
      {walletClient && (
        <BringIDModal
          address={address}
          generateSignature={(message: string) => walletClient.signMessage({ message })}
        />
      )}
      {children}
    </>
  )
}
