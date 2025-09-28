'use client'

import React, { useEffect } from 'react'
import { useMiniKit, useAuthenticate } from '@coinbase/onchainkit/minikit'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'
import { usePlatform } from '../../PlatformContext'
import { BaseAppPlatformProvider } from '../BaseAppPlatformProvider'
import { useBaseAppAuth } from '../hooks/useBaseAppAuth'
import { useBaseAppWallet } from '../hooks/useBaseAppWallet'

export interface BaseAppLayoutProps {
  children: React.ReactNode
}

export default function BaseAppLayout({ children }: BaseAppLayoutProps) {
  const { provider, platformInfo } = usePlatform()
  
  // MiniKit hooks
  const miniKit = useMiniKit()
  const authenticateHook = useAuthenticate()
  const account = useAccount()
  const sendTransaction = useSendTransaction()
  const signMessage = useSignMessage()
  
  // Platform-specific hooks
  const baseAppAuth = useBaseAppAuth()
  const baseAppWallet = useBaseAppWallet()
  
  // Initialize Base App platform with MiniKit hooks
  useEffect(() => {
    if (provider instanceof BaseAppPlatformProvider) {
      const hooks = {
        miniKit,
        authenticate: authenticateHook,
        account,
        sendTransaction,
        signMessage
      }
      
      provider.initializeWithMiniKitHooks(hooks)
      console.log('[BaseAppLayout] Initialized Base App platform with MiniKit hooks')
    }
  }, [provider, miniKit, authenticateHook, account, sendTransaction, signMessage])
  
  return (
    <div className="base-app-container min-h-screen bg-blue-50">
      {/* Base App specific header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">HEARD - Base App</h1>
          <div className="text-sm opacity-75">
            {platformInfo?.name || 'Base App'}
          </div>
        </div>
      </div>
      
      {/* MiniKit integration status */}
      <BaseAppStatusBar 
        baseAppAuth={baseAppAuth}
        baseAppWallet={baseAppWallet}
      />
      
      {/* Content area with Base App constraints */}
      <div className="base-app-content p-4 pb-16"> {/* Extra padding for footer */}
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </div>
      
      {/* Base App footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-2">
        <div className="text-center text-xs">
          Running in Base App Mode
          {baseAppAuth.fid && (
            <span className="ml-2">• FID: {baseAppAuth.fid}</span>
          )}
        </div>
      </div>
      
      {/* Base App indicator */}
      <BaseAppIndicator 
        hasContext={baseAppAuth.hasContextData}
        isAuthenticated={baseAppAuth.isAuthenticated}
      />
    </div>
  )
}

function BaseAppStatusBar({ 
  baseAppAuth, 
  baseAppWallet 
}: { 
  baseAppAuth: any
  baseAppWallet: any 
}) {
  const statusColor = baseAppAuth.isAuthenticated ? 'green' : 
                      baseAppAuth.hasContextData ? 'blue' : 'yellow'
  
  const statusText = baseAppAuth.isAuthenticated ? 'Authenticated' :
                     baseAppAuth.hasContextData ? 'Context Available' : 'No Context'
  
  return (
    <div className="bg-blue-100 border-b border-blue-200 p-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-blue-800">
          <div className={`w-2 h-2 bg-${statusColor}-500 rounded-full mr-2 ${
            !baseAppAuth.isAuthenticated ? 'animate-pulse' : ''
          }`}></div>
          MiniKit: {statusText}
        </div>
        
        <div className="flex items-center space-x-2 text-xs">
          {baseAppWallet.isConnected && (
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
              {baseAppWallet.formatAddress()}
            </span>
          )}
          
          {baseAppAuth.username && (
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded">
              @{baseAppAuth.username}
            </span>
          )}
        </div>
      </div>
      
      {/* Security indicator */}
      <div className="mt-2 text-xs text-blue-600">
        {baseAppAuth.securityNote}
      </div>
    </div>
  )
}

function BaseAppIndicator({ 
  hasContext, 
  isAuthenticated 
}: { 
  hasContext: boolean
  isAuthenticated: boolean 
}) {
  const indicatorColor = isAuthenticated ? 'bg-green-500' : 
                         hasContext ? 'bg-blue-500' : 'bg-yellow-500'
  
  const indicatorText = isAuthenticated ? '🔐 Authenticated' :
                        hasContext ? '🔗 Base App' : '⚠️ No Context'
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${indicatorColor} text-white px-3 py-1 rounded-full text-xs opacity-75 hover:opacity-100 transition-opacity`}>
        {indicatorText}
      </div>
    </div>
  )
}