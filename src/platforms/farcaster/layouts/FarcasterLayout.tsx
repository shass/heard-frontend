'use client'

import React, { useEffect } from 'react'
import { usePlatform } from '../../PlatformContext'
import { FarcasterPlatformProvider } from '../FarcasterPlatformProvider'
import { useFarcasterAuth } from '../hooks/useFarcasterAuth'
import { useFarcasterWallet } from '../hooks/useFarcasterWallet'

export interface FarcasterLayoutProps {
  children: React.ReactNode
}

export default function FarcasterLayout({ children }: FarcasterLayoutProps) {
  const { provider, platformInfo } = usePlatform()
  
  // Farcaster-specific hooks
  const farcasterAuth = useFarcasterAuth()
  const farcasterWallet = useFarcasterWallet()
  
  // Initialize Farcaster Mini App when component mounts
  useEffect(() => {
    if (provider instanceof FarcasterPlatformProvider) {
      console.log('[FarcasterLayout] Initializing Farcaster Mini App layout')
    }
  }, [provider])
  
  return (
    <div className="farcaster-miniapp-container min-h-screen bg-purple-50">
      {/* Farcaster Mini App header */}
      <div className="bg-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">HEARD - Farcaster</h1>
          <div className="text-sm opacity-75">
            {platformInfo?.name || 'Mini App'}
          </div>
        </div>
      </div>
      
      {/* Mini App status bar */}
      <FarcasterStatusBar 
        farcasterAuth={farcasterAuth}
        farcasterWallet={farcasterWallet}
      />
      
      {/* Content area optimized for Mini App */}
      <div className="farcaster-miniapp-content p-4 pb-20"> {/* Extra padding for footer */}
        <div className="max-w-sm mx-auto"> {/* Smaller max width for mobile */}
          {children}
        </div>
      </div>
      
      {/* Mini App footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-purple-600 text-white p-2">
        <div className="text-center text-xs">
          Running in Farcaster Mini App
          {farcasterAuth.fid && (
            <span className="ml-2">• FID: {farcasterAuth.fid}</span>
          )}
        </div>
      </div>
      
      {/* Mini App indicator */}
      <FarcasterIndicator 
        hasContext={farcasterAuth.hasSocialContext}
        isAuthenticated={farcasterAuth.isAuthenticated}
      />
    </div>
  )
}

function FarcasterStatusBar({ 
  farcasterAuth, 
  farcasterWallet 
}: { 
  farcasterAuth: any
  farcasterWallet: any 
}) {
  const statusColor = farcasterAuth.isAuthenticated ? 'green' : 
                      farcasterAuth.hasSocialContext ? 'purple' : 'yellow'
  
  const statusText = farcasterAuth.isAuthenticated ? 'Quick Auth Verified' :
                     farcasterAuth.hasSocialContext ? 'Social Context' : 'No Context'
  
  return (
    <div className="bg-purple-100 border-b border-purple-200 p-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-purple-800">
          <div className={`w-2 h-2 bg-${statusColor}-500 rounded-full mr-2 ${
            !farcasterAuth.isAuthenticated ? 'animate-pulse' : ''
          }`}></div>
          Mini App: {statusText}
        </div>
        
        <div className="flex items-center space-x-2 text-xs">
          {farcasterWallet.isConnected && (
            <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded">
              {farcasterWallet.formatAddress()}
            </span>
          )}
          
          {farcasterAuth.username && (
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded">
              @{farcasterAuth.username}
            </span>
          )}
        </div>
      </div>
      
      {/* Security and capability indicators */}
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {farcasterAuth.securityNote}
        </span>
        
        {farcasterWallet.supportsBatchTransactions && (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
            Batch Transactions
          </span>
        )}
        
        {farcasterAuth.canAuthenticate && (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
            Quick Auth Available
          </span>
        )}
      </div>
    </div>
  )
}

function FarcasterIndicator({ 
  hasContext, 
  isAuthenticated 
}: { 
  hasContext: boolean
  isAuthenticated: boolean 
}) {
  const indicatorColor = isAuthenticated ? 'bg-green-500' : 
                         hasContext ? 'bg-purple-500' : 'bg-yellow-500'
  
  const indicatorText = isAuthenticated ? '🔐 Authenticated' :
                        hasContext ? '🔗 Mini App' : '⚠️ No Context'
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${indicatorColor} text-white px-3 py-1 rounded-full text-xs opacity-75 hover:opacity-100 transition-opacity`}>
        {indicatorText}
      </div>
    </div>
  )
}

// Quick Auth button component
export function FarcasterQuickAuthButton() {
  const farcasterAuth = useFarcasterAuth()
  
  if (!farcasterAuth.canAuthenticate) {
    return null
  }
  
  if (farcasterAuth.isAuthenticated) {
    return (
      <button
        onClick={farcasterAuth.logout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Sign Out
      </button>
    )
  }
  
  return (
    <button
      onClick={farcasterAuth.authenticate}
      disabled={farcasterAuth.isLoading}
      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
    >
      {farcasterAuth.isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Authenticating...
        </>
      ) : (
        <>
          🔐 Quick Auth
        </>
      )}
    </button>
  )
}

// Wallet connect button for Mini Apps
export function FarcasterWalletButton() {
  const farcasterWallet = useFarcasterWallet()
  
  if (farcasterWallet.isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
          <div className="font-medium">{farcasterWallet.formatAddress()}</div>
          <div className="text-xs opacity-75">
            {farcasterWallet.networkName} • {farcasterWallet.formatBalance()}
          </div>
        </div>
        <button
          onClick={farcasterWallet.disconnect}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }
  
  return (
    <button
      onClick={farcasterWallet.connect}
      disabled={farcasterWallet.isLoading}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
    >
      {farcasterWallet.isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Connecting...
        </>
      ) : (
        <>
          💰 Connect Wallet
        </>
      )}
    </button>
  )
}

// Profile card showing Farcaster user info
export function FarcasterProfileCard() {
  const farcasterAuth = useFarcasterAuth()
  
  if (!farcasterAuth.hasSocialContext) {
    return null
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center gap-3">
        {farcasterAuth.pfpUrl && (
          <img
            src={farcasterAuth.pfpUrl}
            alt="Profile"
            className="w-12 h-12 rounded-full"
          />
        )}
        
        <div className="flex-1">
          <div className="font-semibold text-lg">
            {farcasterAuth.displayName || farcasterAuth.username}
          </div>
          <div className="text-gray-600 text-sm">
            @{farcasterAuth.username} • FID: {farcasterAuth.fid}
          </div>
          
          {farcasterAuth.followerCount !== null && (
            <div className="text-xs text-gray-500 mt-1">
              {farcasterAuth.followerCount} followers • {farcasterAuth.followingCount} following
            </div>
          )}
        </div>
        
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          farcasterAuth.isAuthenticated 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {farcasterAuth.isAuthenticated ? 'Verified' : 'Context'}
        </div>
      </div>
    </div>
  )
}