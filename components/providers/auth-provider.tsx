'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuthCleanup } from '@/hooks/use-auth-cleanup'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useAuthEffects } from '@/hooks/use-auth-effects'
import { useAccount } from 'wagmi'
import { PlatformProvider, usePlatform } from '@/src/platforms/PlatformContext'
import { useAuthAdapter } from '@/src/components/hooks/use-auth-adapter'
import { useAuthStore } from '@/lib/store'

interface AuthContextType {
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  isAuthenticated: boolean
  user: any
  isLoading: boolean
  error: string | null
  platform: {
    isMobile: boolean
    isIOS: boolean
    isAndroid: boolean
    isDesktop: boolean
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthActions() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthActions must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

function AuthProviderImpl({ children }: AuthProviderProps) {
  const { address, isConnected } = useAccount()
  const { platform } = usePlatform()
  const auth = useAuthAdapter()
  const authSession = useAuthSession()
  
  // Import auth store directly for fallback
  const { user, isAuthenticated, isLoading, error, setUser, setLoading, logout: storeLogout } = useAuthStore()
  
  const [platformInfo] = useState({
    isMobile: typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent),
    isDesktop: typeof navigator !== 'undefined' && !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  })
  
  useAuthCleanup()
  useAuthEffects({ isConnected, address })

  // Fallback login for web platform (admin panel)
  const webLogin = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    setLoading(true)
    try {
      const { authApi } = await import('@/lib/api/auth')
      const wagmiActions = await import('wagmi/actions')
      const { config } = await import('@/components/providers/web3-provider')
      
      // Get nonce from backend
      const { message, jwtToken } = await authApi.getNonce(address)
      
      // Sign message with wallet
      const signature = await wagmiActions.signMessage(config, { 
        account: address,
        message 
      })
      
      // Connect wallet and get user data
      const { user } = await authApi.connectWallet({
        walletAddress: address,
        signature,
        message,
        jwtToken
      })
      
      setUser(user)
    } catch (error) {
      console.error('Web login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const contextValue: AuthContextType = {
    login: async () => {
      // Use platform-specific auth if available, otherwise use web fallback
      if (auth.canAuthenticate) {
        await auth.authenticate()
      } else if (platform === 'web' && isConnected) {
        // Fallback to direct web authentication for admin panel
        await webLogin()
      } else {
        throw new Error('Authentication not available')
      }
    },
    logout: async () => {
      if (auth.logout) {
        await auth.logout()
      }
      storeLogout()
    },
    checkAuth: authSession.checkAuth,
    isAuthenticated: auth.isAuthenticated || isAuthenticated,
    user: auth.user || user,
    isLoading: auth.isLoading || isLoading,
    error: auth.error || error,
    platform: platformInfo,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <PlatformProvider>
      <AuthProviderImpl>
        {children}
      </AuthProviderImpl>
    </PlatformProvider>
  )
}