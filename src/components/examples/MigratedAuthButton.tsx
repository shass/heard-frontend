'use client'

import React from 'react'
import { 
  withPlatformMigration, 
  useMigrationChoice,
  PlatformSwitch,
  FeatureFlag,
  useCompatibleWallet,
  useCompatibleAuth 
} from '@/src/platforms'

// Legacy implementation (existing component)
interface AuthButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function LegacyAuthButton({ variant = 'primary', size = 'md', className = '' }: AuthButtonProps) {
  const auth = useCompatibleAuth()
  const wallet = useCompatibleWallet()

  const baseStyles = 'rounded-lg font-medium transition-colors'
  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  }
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const handleAuth = async () => {
    try {
      if (!wallet.isConnected) {
        await wallet.connect()
      }
      
      if (!auth.isAuthenticated) {
        await auth.login()
      } else {
        await auth.logout()
      }
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  return (
    <button
      onClick={handleAuth}
      disabled={auth.isLoading || wallet.isConnecting}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {auth.isLoading || wallet.isConnecting ? (
        'Loading...'
      ) : !wallet.isConnected ? (
        'Connect Wallet'
      ) : auth.isAuthenticated ? (
        'Disconnect'
      ) : (
        'Sign In'
      )}
    </button>
  )
}

// New platform-aware implementation
function ModernAuthButton({ variant = 'primary', size = 'md', className = '' }: AuthButtonProps) {
  const auth = useCompatibleAuth()
  const wallet = useCompatibleWallet()

  // Use platform-aware styling and behavior
  const styles = useMigrationChoice({
    legacy: {
      baseStyles: 'rounded-lg font-medium transition-colors',
      connectText: 'Connect Wallet',
      signInText: 'Sign In'
    },
    platform: {
      baseStyles: 'rounded-xl font-semibold transition-all shadow-sm hover:shadow-md',
      connectText: 'Connect',
      signInText: 'Authenticate'
    }
  })

  const platformInfo = wallet.getPlatformInfo()

  const handleAuth = async () => {
    try {
      if (!wallet.isConnected) {
        await wallet.connect()
      }
      
      if (!auth.isAuthenticated) {
        // Try platform-specific login if available
        if (auth.loginWithPlatform) {
          await auth.loginWithPlatform()
        } else {
          await auth.login()
        }
      } else {
        await auth.logout()
      }
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  const baseStyles = styles.baseStyles
  const variantStyles = {
    primary: platformInfo.platform === 'farcaster' 
      ? 'bg-purple-500 hover:bg-purple-600 text-white'
      : platformInfo.platform === 'base-app'
      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
      : 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  }
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAuth}
        disabled={auth.isLoading || wallet.isConnecting}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      >
        <PlatformSwitch
          web={
            auth.isLoading || wallet.isConnecting ? (
              '⏳ Loading...'
            ) : !wallet.isConnected ? (
              styles.connectText
            ) : auth.isAuthenticated ? (
              'Disconnect'
            ) : (
              styles.signInText
            )
          }
          baseApp={
            auth.isLoading || wallet.isConnecting ? (
              '🔄 Connecting...'
            ) : !wallet.isConnected ? (
              '🔗 Connect'
            ) : auth.isAuthenticated ? (
              '🚪 Sign Out'
            ) : (
              '🔐 Authenticate'
            )
          }
          farcaster={
            auth.isLoading || wallet.isConnecting ? (
              '🎭 Loading...'
            ) : !wallet.isConnected ? (
              '🎭 Connect Frame'
            ) : auth.isAuthenticated ? (
              '👋 Sign Out'
            ) : (
              '🎭 Quick Auth'
            )
          }
          fallback={
            auth.isLoading || wallet.isConnecting ? (
              'Loading...'
            ) : !wallet.isConnected ? (
              'Connect'
            ) : auth.isAuthenticated ? (
              'Disconnect'
            ) : (
              'Sign In'
            )
          }
        />
      </button>

      {/* Platform-specific features */}
      <FeatureFlag feature="quick-auth">
        <div className="text-xs text-gray-500">
          Using {platformInfo.platform} authentication
        </div>
      </FeatureFlag>
    </div>
  )
}

// Export the migrated component
export const AuthButton = withPlatformMigration(
  LegacyAuthButton,
  ModernAuthButton,
  {
    componentName: 'AuthButton',
    showMigrationInfo: process.env.NODE_ENV === 'development'
  }
)

// Alternative: Using the migration choice hook directly
export function FlexibleAuthButton(props: AuthButtonProps) {
  const ButtonComponent = useMigrationChoice({
    legacy: LegacyAuthButton,
    platform: ModernAuthButton
  })

  return <ButtonComponent {...props} />
}

// Example of capability-based rendering
export function AdvancedAuthButton(props: AuthButtonProps) {
  return (
    <div className="space-y-2">
      {/* Always show basic auth button */}
      <AuthButton {...props} />
      
      {/* Show additional features based on platform capabilities */}
      <FeatureFlag feature="multi-account">
        <button className="text-xs text-blue-500 hover:text-blue-600">
          Switch Account
        </button>
      </FeatureFlag>
      
      <FeatureFlag feature="quick-auth">
        <button className="text-xs text-purple-500 hover:text-purple-600">
          Quick Connect
        </button>
      </FeatureFlag>
    </div>
  )
}

export default AuthButton