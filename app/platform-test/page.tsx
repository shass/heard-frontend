'use client'

import { PlatformProvider } from '@/src/platforms/PlatformContext'
import { PlatformDebugger } from '@/src/platforms/components/PlatformDebugger'
import { Web3Provider } from '@/components/providers/web3-provider'

export default function PlatformTestPage() {
  return (
    <Web3Provider>
      <PlatformProvider>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform System Test - Phase 2</h1>
            
            <div className="space-y-6">
              <PlatformDebugger />
              
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Phase 2 Testing</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    <strong>Web Platform Features:</strong> Test wallet connection and authentication flow
                  </p>
                  <p>
                    <strong>1. Connect Wallet:</strong> Click "Connect Wallet" button in the Web3 Wallet Status section
                  </p>
                  <p>
                    <strong>2. Sign In:</strong> After wallet is connected, click "Sign In" to authenticate
                  </p>
                  <p>
                    <strong>3. View Details:</strong> Check all the platform information, browser capabilities, and provider status
                  </p>
                  <p>
                    <strong>Platform Testing:</strong> Use console commands to simulate other platforms:
                  </p>
                  <code className="block bg-gray-100 p-2 mt-1 rounded">
                    // Base App: window.MiniKit = {}; location.reload()
                    // Farcaster: Try in iframe
                    // Telegram: window.Telegram = {'{WebApp: {}'}; location.reload()
                  </code>
                </div>
              </div>
              
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Phase 1 & 2 Status</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-green-700">
                    <strong>Phase 1:</strong> Architecture Foundation ✅ Complete
                  </p>
                  <p className="text-green-700">
                    <strong>Phase 2:</strong> Web Platform Implementation ✅ Complete
                  </p>
                  <p className="text-green-700">
                    Multi-platform system is now functional with Web3 wallet integration and authentication!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PlatformProvider>
    </Web3Provider>
  )
}