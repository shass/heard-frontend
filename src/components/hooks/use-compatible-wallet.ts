'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export function useCompatibleWallet() {
  const { isConnected, address, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()

  return {
    isConnected,
    address,
    isConnecting,
    connect: openConnectModal,
    disconnect,
  }
}