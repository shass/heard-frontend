'use client'

import { usePlatform } from '../PlatformContext'
import { WebPlatformProvider } from '../web/WebPlatformProvider'
import { BaseAppPlatformProvider } from '../base-app/BaseAppPlatformProvider'
import { FarcasterPlatformProvider } from '../farcaster/FarcasterPlatformProvider'
import { useWebAuth } from '../web/hooks/useWebAuth'
import { useWebWallet } from '../web/hooks/useWebWallet'
import { useBaseAppAuth } from '../base-app/hooks/useBaseAppAuth'
import { useBaseAppWallet } from '../base-app/hooks/useBaseAppWallet'
import { useFarcasterAuth } from '../farcaster/hooks/useFarcasterAuth'
import { useFarcasterWallet } from '../farcaster/hooks/useFarcasterWallet'

export function PlatformDebugger() {
  const { platform, provider, isLoading, error, platformInfo, isInitialized } = usePlatform()
  
  if (isLoading) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Platform Loading...</h3>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800">Platform Error</h3>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    )
  }
  
  if (!isInitialized || !platformInfo) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-800">Platform Not Initialized</h3>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <BasicPlatformInfo platformInfo={platformInfo} />
      {platform === 'web' && provider instanceof WebPlatformProvider && (
        <WebPlatformDetails provider={provider} />
      )}
      {platform === 'base-app' && provider instanceof BaseAppPlatformProvider && (
        <BaseAppPlatformDetails provider={provider} />
      )}
      {platform === 'farcaster' && provider instanceof FarcasterPlatformProvider && (
        <FarcasterPlatformDetails provider={provider} />
      )}
    </div>
  )
}

function BasicPlatformInfo({ platformInfo }: { platformInfo: any }) {
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="font-semibold text-green-800 mb-3">Platform Information</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Platform:</span>{' '}
          <span className="text-green-700">{platformInfo.platform}</span>
        </div>
        <div>
          <span className="font-medium">Name:</span>{' '}
          <span className="text-green-700">{platformInfo.name}</span>
        </div>
        <div>
          <span className="font-medium">Version:</span>{' '}
          <span className="text-green-700 font-mono text-xs">{platformInfo.version}</span>
        </div>
        <div>
          <span className="font-medium">Supported:</span>{' '}
          <span className={platformInfo.supported ? 'text-green-700' : 'text-red-600'}>
            {platformInfo.supported ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="font-medium">Features:</span>{' '}
          <div className="mt-1">
            {platformInfo.features.map((feature: string) => (
              <span 
                key={feature}
                className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1 mb-1"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WebPlatformDetails({ provider }: { provider: WebPlatformProvider }) {
  const webAuth = useWebAuth()
  const webWallet = useWebWallet()
  
  const capabilities = provider.getBrowserCapabilities()
  const authProvider = provider.getAuthProvider()
  const walletProvider = provider.getWalletProvider()
  
  return (
    <>
      {/* Web Wallet Status */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-3">Web3 Wallet Status</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Connected:</span>{' '}
            <span className={webWallet.isConnected ? 'text-green-600' : 'text-red-600'}>
              {webWallet.isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          {webWallet.address && (
            <div>
              <span className="font-medium">Address:</span>{' '}
              <span className="font-mono text-xs text-blue-700">
                {webWallet.address.slice(0, 6)}...{webWallet.address.slice(-4)}
              </span>
            </div>
          )}
          {webWallet.balanceFormatted && (
            <div>
              <span className="font-medium">Balance:</span>{' '}
              <span className="text-blue-700">{webWallet.balanceFormatted} ETH</span>
            </div>
          )}
          <div>
            <span className="font-medium">Available Connectors:</span>{' '}
            <div className="mt-1">
              {webWallet.getConnectors().map((connector) => (
                <span 
                  key={connector.id}
                  className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1 mb-1"
                >
                  {connector.name} ({connector.ready ? 'Ready' : 'Not Ready'})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Web Auth Status */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-800 mb-3">Authentication Status</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Auth State:</span>{' '}
            <span className={
              webAuth.isAuthenticated ? 'text-green-600' :
              webAuth.isLoading ? 'text-yellow-600' :
              webAuth.error ? 'text-red-600' : 'text-gray-600'
            }>
              {webAuth.authState}
            </span>
          </div>
          <div>
            <span className="font-medium">Can Authenticate:</span>{' '}
            <span className={webAuth.canAuthenticate ? 'text-green-600' : 'text-red-600'}>
              {webAuth.canAuthenticate ? 'Yes' : 'No'}
            </span>
          </div>
          {webAuth.user && (
            <div>
              <span className="font-medium">User ID:</span>{' '}
              <span className="text-purple-700 font-mono text-xs">{webAuth.user.id}</span>
            </div>
          )}
          {webAuth.error && (
            <div>
              <span className="font-medium">Error:</span>{' '}
              <span className="text-red-600">{webAuth.error}</span>
            </div>
          )}
          
          {/* Quick actions */}
          <div className="pt-2 space-x-2">
            {!webWallet.isConnected && (
              <button
                onClick={webWallet.connect}
                disabled={webWallet.isLoading}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
              >
                {webWallet.isLoading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            
            {webWallet.isConnected && !webAuth.isAuthenticated && (
              <button
                onClick={webAuth.authenticate}
                disabled={webAuth.isLoading || !webAuth.canAuthenticate}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50"
              >
                {webAuth.isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            )}
            
            {webAuth.isAuthenticated && (
              <button
                onClick={webAuth.logout}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Browser Capabilities */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">Browser Capabilities</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div><span className="font-medium">WebPush:</span> {capabilities.webPush ? '✅' : '❌'}</div>
            <div><span className="font-medium">WebShare:</span> {capabilities.webShare ? '✅' : '❌'}</div>
            <div><span className="font-medium">WebGL:</span> {capabilities.webGL ? '✅' : '❌'}</div>
            <div><span className="font-medium">Touch:</span> {capabilities.touchSupport ? '✅' : '❌'}</div>
            <div><span className="font-medium">Cookies:</span> {capabilities.cookiesEnabled ? '✅' : '❌'}</div>
          </div>
          <div>
            <div><span className="font-medium">Resolution:</span> {capabilities.screenResolution}</div>
            <div><span className="font-medium">Language:</span> {capabilities.language}</div>
            <div><span className="font-medium">Platform:</span> {capabilities.platform}</div>
            <div><span className="font-medium">Timezone:</span> {capabilities.timezone}</div>
            <div><span className="font-medium">Online:</span> {capabilities.onlineStatus ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>
      
      {/* Provider Status */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="font-semibold text-orange-800 mb-3">Provider Status</h3>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Auth Provider:</span>{' '}
            <span className={authProvider ? 'text-green-600' : 'text-red-600'}>
              {authProvider ? 'Initialized' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Wallet Provider:</span>{' '}
            <span className={walletProvider ? 'text-green-600' : 'text-red-600'}>
              {walletProvider ? 'Initialized' : 'Not Available'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

function BaseAppPlatformDetails({ provider }: { provider: BaseAppPlatformProvider }) {
  const baseAppAuth = useBaseAppAuth()
  const baseAppWallet = useBaseAppWallet()
  
  const capabilities = provider.getMiniKitCapabilities()
  const environmentInfo = provider.getEnvironmentInfo()
  const authProvider = provider.getAuthProvider()
  const walletProvider = provider.getWalletProvider()
  
  return (
    <>
      {/* Base App Wallet Status */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-3">Base App Wallet Status</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Connected:</span>{' '}
            <span className={baseAppWallet.isConnected ? 'text-green-600' : 'text-red-600'}>
              {baseAppWallet.isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          {baseAppWallet.address && (
            <div>
              <span className="font-medium">Address:</span>{' '}
              <span className="font-mono text-xs text-blue-700">
                {baseAppWallet.formatAddress()}
              </span>
            </div>
          )}
          <div>
            <span className="font-medium">Chain:</span>{' '}
            <span className="text-blue-700">{baseAppWallet.networkInfo?.networkName}</span>
          </div>
          <div>
            <span className="font-medium">Custody Wallet:</span>{' '}
            <span className={baseAppWallet.custodyWallet.address ? 'text-green-600' : 'text-gray-600'}>
              {baseAppWallet.custodyWallet.address ? 'Available' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Gasless Transactions:</span>{' '}
            <span className="text-green-600">{baseAppWallet.canUseGasless ? 'Supported' : 'Not Supported'}</span>
          </div>
        </div>
      </div>
      
      {/* Base App Auth Status */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-800 mb-3">Base App Authentication</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Auth State:</span>{' '}
            <span className={
              baseAppAuth.isAuthenticated ? 'text-green-600' :
              baseAppAuth.isLoading ? 'text-yellow-600' :
              baseAppAuth.error ? 'text-red-600' : 'text-gray-600'
            }>
              {baseAppAuth.authState}
            </span>
          </div>
          <div>
            <span className="font-medium">Has Context:</span>{' '}
            <span className={baseAppAuth.hasContextData ? 'text-green-600' : 'text-red-600'}>
              {baseAppAuth.hasContextData ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Security Level:</span>{' '}
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {baseAppAuth.securityNote}
            </span>
          </div>
          {baseAppAuth.fid && (
            <div>
              <span className="font-medium">FID:</span>{' '}
              <span className="text-purple-700 font-mono text-xs">{baseAppAuth.fid}</span>
            </div>
          )}
          {baseAppAuth.username && (
            <div>
              <span className="font-medium">Username:</span>{' '}
              <span className="text-purple-700">@{baseAppAuth.username}</span>
            </div>
          )}
          {baseAppAuth.error && (
            <div>
              <span className="font-medium">Error:</span>{' '}
              <span className="text-red-600">{baseAppAuth.error}</span>
            </div>
          )}
          
          {/* Quick actions */}
          <div className="pt-2 space-x-2">
            {!baseAppAuth.isAuthenticated && baseAppAuth.canAuthenticate && (
              <button
                onClick={baseAppAuth.authenticate}
                disabled={baseAppAuth.isLoading}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50"
              >
                {baseAppAuth.isLoading ? 'Authenticating...' : 'Authenticate with MiniKit'}
              </button>
            )}
            
            {baseAppAuth.isAuthenticated && (
              <button
                onClick={baseAppAuth.logout}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Farcaster Context */}
      {baseAppWallet.farcasterInfo.fid && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-3">Farcaster Profile</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div><span className="font-medium">FID:</span> {baseAppWallet.farcasterInfo.fid}</div>
              <div><span className="font-medium">Username:</span> @{baseAppWallet.farcasterInfo.username}</div>
              <div><span className="font-medium">Display Name:</span> {baseAppWallet.farcasterInfo.displayName}</div>
            </div>
            <div>
              {baseAppWallet.farcasterInfo.pfpUrl && (
                <img 
                  src={baseAppWallet.farcasterInfo.pfpUrl} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* MiniKit Capabilities */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">MiniKit Capabilities</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div><span className="font-medium">Gasless TX:</span> {capabilities.gaslessTransactions ? '✅' : '❌'}</div>
            <div><span className="font-medium">Custody Wallet:</span> {capabilities.custodyWallet ? '✅' : '❌'}</div>
            <div><span className="font-medium">Base Chain:</span> {capabilities.baseChain ? '✅' : '❌'}</div>
            <div><span className="font-medium">Mobile Optimized:</span> {capabilities.mobileOptimized ? '✅' : '❌'}</div>
          </div>
          <div>
            <div><span className="font-medium">Compose Cast:</span> {capabilities.composeCast ? '✅' : '❌'}</div>
            <div><span className="font-medium">View Profile:</span> {capabilities.viewProfile ? '✅' : '❌'}</div>
            <div><span className="font-medium">Farcaster Context:</span> {capabilities.farcasterContext ? '✅' : '❌'}</div>
            <div><span className="font-medium">Limited Storage:</span> {capabilities.limitedStorage ? '⚠️' : '✅'}</div>
          </div>
        </div>
      </div>
      
      {/* Environment Info */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="font-semibold text-orange-800 mb-3">Environment Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Is Base App:</span>{' '}
            <span className={environmentInfo.isBaseApp ? 'text-green-600' : 'text-red-600'}>
              {environmentInfo.isBaseApp ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Has MiniKit:</span>{' '}
            <span className={environmentInfo.hasMinKit ? 'text-green-600' : 'text-red-600'}>
              {environmentInfo.hasMinKit ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Farcaster Context:</span>{' '}
            <span className={environmentInfo.isFarcasterContext ? 'text-green-600' : 'text-red-600'}>
              {environmentInfo.isFarcasterContext ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Client Info:</span>{' '}
            <span className="text-orange-700">
              FID: {baseAppWallet.clientInfo.clientFid || 'N/A'}, 
              Name: {baseAppWallet.clientInfo.clientName || 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Referrer:</span>{' '}
            <span className="text-orange-700 text-xs break-all">{environmentInfo.referrer}</span>
          </div>
        </div>
      </div>
      
      {/* Provider Status */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="font-semibold text-indigo-800 mb-3">Provider Status</h3>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Auth Provider:</span>{' '}
            <span className={authProvider ? 'text-green-600' : 'text-red-600'}>
              {authProvider ? 'Initialized' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Wallet Provider:</span>{' '}
            <span className={walletProvider ? 'text-green-600' : 'text-red-600'}>
              {walletProvider ? 'Initialized' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Raw Context Available:</span>{' '}
            <span className={baseAppWallet.rawContext ? 'text-green-600' : 'text-red-600'}>
              {baseAppWallet.rawContext ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

function FarcasterPlatformDetails({ provider }: { provider: FarcasterPlatformProvider }) {
  const farcasterAuth = useFarcasterAuth()
  const farcasterWallet = useFarcasterWallet()
  
  const capabilities = provider.getMiniAppCapabilities()
  const environmentInfo = provider.getEnvironmentInfo()
  const authProvider = provider.getAuthProvider()
  const walletProvider = provider.getWalletProvider()
  const miniAppSdk = provider.getMiniAppSdk()
  
  return (
    <>
      {/* Farcaster Wallet Status */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-800 mb-3">Farcaster Wallet Status</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Connected:</span>{' '}
            <span className={farcasterWallet.isConnected ? 'text-green-600' : 'text-red-600'}>
              {farcasterWallet.isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          {farcasterWallet.address && (
            <div>
              <span className="font-medium">Address:</span>{' '}
              <span className="font-mono text-xs text-purple-700">
                {farcasterWallet.formatAddress()}
              </span>
            </div>
          )}
          {farcasterWallet.balance && (
            <div>
              <span className="font-medium">Balance:</span>{' '}
              <span className="text-purple-700">{farcasterWallet.formatBalance()}</span>
            </div>
          )}
          <div>
            <span className="font-medium">Network:</span>{' '}
            <span className="text-purple-700">
              {farcasterWallet.networkName} (Chain ID: {farcasterWallet.chainId})
            </span>
          </div>
          <div>
            <span className="font-medium">Batch Transactions:</span>{' '}
            <span className={farcasterWallet.supportsBatchTransactions ? 'text-green-600' : 'text-red-600'}>
              {farcasterWallet.supportsBatchTransactions ? 'Supported' : 'Not Supported'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Farcaster Auth Status */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="font-semibold text-indigo-800 mb-3">Farcaster Authentication Status</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Auth State:</span>{' '}
            <span className={
              farcasterAuth.isAuthenticated ? 'text-green-600' :
              farcasterAuth.isLoading ? 'text-yellow-600' :
              farcasterAuth.error ? 'text-red-600' : 'text-gray-600'
            }>
              {farcasterAuth.authState}
            </span>
          </div>
          <div>
            <span className="font-medium">Has Social Context:</span>{' '}
            <span className={farcasterAuth.hasSocialContext ? 'text-green-600' : 'text-red-600'}>
              {farcasterAuth.hasSocialContext ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Can Authenticate:</span>{' '}
            <span className={farcasterAuth.canAuthenticate ? 'text-green-600' : 'text-red-600'}>
              {farcasterAuth.canAuthenticate ? 'Yes (Quick Auth)' : 'No'}
            </span>
          </div>
          {farcasterAuth.fid && (
            <div>
              <span className="font-medium">FID:</span>{' '}
              <span className="text-indigo-700 font-mono text-xs">{farcasterAuth.fid}</span>
            </div>
          )}
          {farcasterAuth.username && (
            <div>
              <span className="font-medium">Username:</span>{' '}
              <span className="text-indigo-700">@{farcasterAuth.username}</span>
            </div>
          )}
          {farcasterAuth.displayName && (
            <div>
              <span className="font-medium">Display Name:</span>{' '}
              <span className="text-indigo-700">{farcasterAuth.displayName}</span>
            </div>
          )}
          {farcasterAuth.error && (
            <div>
              <span className="font-medium">Error:</span>{' '}
              <span className="text-red-600">{farcasterAuth.error}</span>
            </div>
          )}
          
          {/* Security note */}
          <div className="pt-2">
            <div className="bg-blue-100 text-blue-800 p-2 rounded text-xs">
              <span className="font-medium">Security:</span> {farcasterAuth.securityNote}
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="pt-2 space-x-2">
            {!farcasterWallet.isConnected && (
              <button
                onClick={farcasterWallet.connect}
                disabled={farcasterWallet.isLoading}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50"
              >
                {farcasterWallet.isLoading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            
            {farcasterAuth.canAuthenticate && !farcasterAuth.isAuthenticated && (
              <button
                onClick={farcasterAuth.authenticate}
                disabled={farcasterAuth.isLoading}
                className="px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 disabled:opacity-50"
              >
                {farcasterAuth.isLoading ? 'Authenticating...' : 'Quick Auth'}
              </button>
            )}
            
            {farcasterAuth.isAuthenticated && (
              <button
                onClick={farcasterAuth.logout}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mini App Capabilities */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="font-semibold text-orange-800 mb-3">Mini App Capabilities</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Quick Auth:</span>{' '}
            <span className={capabilities.quickAuth ? 'text-green-600' : 'text-red-600'}>
              {capabilities.quickAuth ? 'Available' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Batch Transactions:</span>{' '}
            <span className={capabilities.batchTransactions ? 'text-green-600' : 'text-red-600'}>
              {capabilities.batchTransactions ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          <div>
            <span className="font-medium">Notifications:</span>{' '}
            <span className={capabilities.notifications ? 'text-green-600' : 'text-red-600'}>
              {capabilities.notifications ? 'Available' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Social Graph:</span>{' '}
            <span className={capabilities.socialGraph ? 'text-green-600' : 'text-red-600'}>
              {capabilities.socialGraph ? 'Available' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Mobile Optimized:</span>{' '}
            <span className="text-green-600">Yes</span>
          </div>
          <div>
            <span className="font-medium">Sandboxed:</span>{' '}
            <span className="text-yellow-600">Yes</span>
          </div>
        </div>
      </div>
      
      {/* Environment Info */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="font-semibold text-slate-800 mb-3">Environment Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Is Mini App:</span>{' '}
            <span className={environmentInfo.isMiniApp ? 'text-green-600' : 'text-red-600'}>
              {environmentInfo.isMiniApp ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Is Farcaster Client:</span>{' '}
            <span className={environmentInfo.isFarcasterClient ? 'text-green-600' : 'text-red-600'}>
              {environmentInfo.isFarcasterClient ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Has Mini App SDK:</span>{' '}
            <span className={environmentInfo.hasMiniAppSdk ? 'text-green-600' : 'text-red-600'}>
              {environmentInfo.hasMiniAppSdk ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">User Agent:</span>{' '}
            <span className="text-slate-700 text-xs break-all">
              {environmentInfo.userAgent}
            </span>
          </div>
          <div>
            <span className="font-medium">Referrer:</span>{' '}
            <span className="text-slate-700 text-xs break-all">
              {environmentInfo.referrer || 'N/A'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Provider Status */}
      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <h3 className="font-semibold text-cyan-800 mb-3">Provider Status</h3>
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">Auth Provider:</span>{' '}
            <span className={authProvider ? 'text-green-600' : 'text-red-600'}>
              {authProvider ? 'Initialized' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Wallet Provider:</span>{' '}
            <span className={walletProvider ? 'text-green-600' : 'text-red-600'}>
              {walletProvider ? 'Initialized' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Mini App SDK:</span>{' '}
            <span className={miniAppSdk ? 'text-green-600' : 'text-red-600'}>
              {miniAppSdk ? 'Loaded' : 'Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Ethereum Provider:</span>{' '}
            <span className={farcasterWallet.ethereumProvider ? 'text-green-600' : 'text-red-600'}>
              {farcasterWallet.ethereumProvider ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}