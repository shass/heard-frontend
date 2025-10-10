'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuthCleanup } from '@/hooks/use-auth-cleanup'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useAuthEffects } from '@/hooks/use-auth-effects'
import { useAccount } from 'wagmi'
import { PlatformProvider, usePlatform } from '@/src/platforms/PlatformContext'
import { useAuthAdapter } from '@/src/components/hooks/use-auth-adapter'
import { useAuthStore } from '@/lib/store'
import { Platform } from '@/src/platforms/config'

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
      console.log('[AuthProvider] 🚀 Login called')
      console.log('[AuthProvider] auth.canAuthenticate:', auth.canAuthenticate)
      console.log('[AuthProvider] platform:', platform)
      console.log('[AuthProvider] isConnected:', isConnected)

      try {
        // Use platform-specific auth if available, otherwise use web fallback
        if (auth.canAuthenticate) {
          console.log('[AuthProvider] 📱 Using platform-specific auth')
          console.log('[AuthProvider] Auth object:', {
            canAuthenticate: auth.canAuthenticate,
            isAuthenticated: auth.isAuthenticated,
            isLoading: auth.isLoading,
            error: auth.error,
            user: auth.user
          })

          const result = await auth.authenticate()
          console.log('[AuthProvider] ✅ Platform auth result:', result)

          // CRITICAL: After platform auth, fetch full user data from backend
          // Platform User type is minimal, we need full User data from backend
          if (result) {
            console.log('[AuthProvider] 🔄 Fetching full user data from backend...')
            try {
              const { authApi } = await import('@/lib/api/auth')
              const fullUser = await authApi.checkAuth()

              if (fullUser) {
                console.log('[AuthProvider] ✅ Got full user data:', fullUser)
                setUser(fullUser)
              } else {
                console.warn('[AuthProvider] ⚠️ Backend checkAuth returned no user')
              }
            } catch (error) {
              console.error('[AuthProvider] ❌ Failed to fetch full user data:', error)
            }
          }
        } else if (platform === Platform.WEB && isConnected) {
          console.log('[AuthProvider] 💻 Using web fallback auth')
          // Fallback to direct web authentication for admin panel
          await webLogin()
          console.log('[AuthProvider] ✅ Web auth completed')
        } else {
          console.error('[AuthProvider] ❌ No authentication method available')
          console.error('[AuthProvider] Details:', {
            authCanAuthenticate: auth.canAuthenticate,
            platform,
            isConnected,
            authObject: auth
          })
          throw new Error('Authentication not available')
        }
      } catch (error: any) {
        console.error('[AuthProvider] ❌ Login failed:', error)
        console.error('[AuthProvider] Error details:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        })
        throw error
      }
    },
    logout: async () => {
      console.log('[AuthProvider] 🚪 Logout called')
      try {
        if (auth.logout) {
          console.log('[AuthProvider] Calling platform logout')
          await auth.logout()
        }
        console.log('[AuthProvider] Calling store logout')
        storeLogout()
        console.log('[AuthProvider] ✅ Logout completed')
      } catch (error: any) {
        console.error('[AuthProvider] ❌ Logout failed:', error)
        // Continue with store logout even if platform logout fails
        storeLogout()
      }
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