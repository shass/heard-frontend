'use client'

import { useCallback, useRef, useEffect } from 'react'
import { BringIDModal } from 'bringid/react'
import { useWallet } from '@/src/platforms/_core'

interface BringIDProviderProps {
  children: React.ReactNode
}

/**
 * BringID Provider Component
 *
 * Wraps children with BringIDModal for identity verification UI.
 * Uses platform-agnostic wallet strategy so signing works on Web,
 * Farcaster and Base App (MiniKit) equally.
 */
export function BringIDProvider({ children }: BringIDProviderProps) {
  const wallet = useWallet()

  const walletRef = useRef(wallet)
  useEffect(() => { walletRef.current = wallet }, [wallet])

  const generateSignature = useCallback(
    (message: string) => walletRef.current.signMessage(message),
    []
  )

  return (
    <>
      <BringIDModal
        address={wallet.address}
        generateSignature={generateSignature}
      />
      {children}
    </>
  )
}
