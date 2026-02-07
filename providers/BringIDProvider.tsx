'use client'

import { useCallback, useEffect, useRef } from 'react'
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

  const walletClientRef = useRef(walletClient)
  useEffect(() => { walletClientRef.current = walletClient }, [walletClient])

  const generateSignature = useCallback(
    (message: string) => {
      if (!walletClientRef.current) return Promise.reject(new Error('No wallet client'))
      return walletClientRef.current.signMessage({ message })
    },
    []
  )

  return (
    <>
      {walletClient && (
        <BringIDModal
          address={address}
          generateSignature={generateSignature}
        />
      )}
      {children}
    </>
  )
}
