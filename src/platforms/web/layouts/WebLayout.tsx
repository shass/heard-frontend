'use client'

import React, { useEffect } from 'react'
import { useAccount, useSignMessage, useConnect, useDisconnect, useBalance, useSendTransaction } from 'wagmi'
import { usePlatform } from '../../PlatformContext'
import { WebPlatformProvider } from '../WebPlatformProvider'

export interface WebLayoutProps {
  children: React.ReactNode
}

export function WebLayout({ children }: WebLayoutProps) {
  const { provider } = usePlatform()
  
  // Wagmi hooks for Web platform
  const account = useAccount()
  const signMessage = useSignMessage()
  const connect = useConnect()
  const disconnect = useDisconnect()
  const balance = useBalance({ address: account.address })
  const sendTransaction = useSendTransaction()
  
  // Initialize Web platform with wagmi hooks
  useEffect(() => {
    if (provider instanceof WebPlatformProvider) {
      const wagmiHooks = {
        account,
        signMessage,
        connect,
        disconnect,
        balance,
        sendTransaction
      }
      
      provider.initializeWithWagmiHooks(wagmiHooks)
      console.log('[WebLayout] Initialized Web platform with wagmi hooks')
    }
  }, [provider, account, signMessage, connect, disconnect, balance, sendTransaction])
  
  return (
    <div className="web-platform-container">
      <div className="web-platform-content">
        {children}
      </div>
      
      {/* Web-specific UI elements can be added here */}
      <WebPlatformIndicator />
    </div>
  )
}

function WebPlatformIndicator() {
  const { platformInfo, provider } = usePlatform()
  
  if (!platformInfo || platformInfo.platform !== 'web') {
    return null
  }
  
  const webProvider = provider as WebPlatformProvider
  const capabilities = webProvider?.getBrowserCapabilities?.()
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs opacity-75 hover:opacity-100 transition-opacity">
        🌐 {platformInfo.name}
        {capabilities && (
          <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-gray-900 text-white p-2 rounded text-xs whitespace-nowrap">
            <div>Resolution: {capabilities.screenResolution}</div>
            <div>Language: {capabilities.language}</div>
            <div>Online: {capabilities.onlineStatus ? 'Yes' : 'No'}</div>
            {capabilities.touchSupport && <div>Touch: Supported</div>}
          </div>
        )}
      </div>
    </div>
  )
}