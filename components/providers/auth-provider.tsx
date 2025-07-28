'use client'

import React, { createContext, useContext } from 'react'
import { useAccount } from 'wagmi'
import { useAuthCleanup } from '@/hooks/use-auth-cleanup'
import { useMobileWallet } from '@/hooks/use-mobile-wallet'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useAuthLogin } from '@/hooks/use-auth-login'
import { useAuthLogout } from '@/hooks/use-auth-logout'
import { useAuthEffects } from '@/hooks/use-auth-effects'

// Создаем контекст для auth actions
interface AuthContextType {
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  isWaitingForSignature: boolean
  isMobileAndroid: boolean
  isMobileIOS: boolean
  isMobile: boolean
  platformInfo: {
    walletType: 'metamask' | 'trust' | 'coinbase' | 'unknown'
    connectionMethod: 'injected' | 'walletconnect' | 'unknown'
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

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected } = useAccount()
  
  // Mobile wallet handling
  const mobileWallet = useMobileWallet()
  
  // Authentication hooks
  const { checkAuth } = useAuthSession()
  const { login } = useAuthLogin()
  const { logout } = useAuthLogout()
  
  // Enable global authentication cleanup
  useAuthCleanup()
  
  // Handle all authentication effects
  useAuthEffects({ isConnected, address })

  // Wrapper functions that pass wallet state to hooks
  const handleLogin = () => login(isConnected, address)
  const handleCheckAuth = () => checkAuth(isConnected, address)

  const contextValue: AuthContextType = {
    login: handleLogin,
    logout,
    checkAuth: handleCheckAuth,
    isWaitingForSignature: mobileWallet.isWaitingForSignature,
    isMobileAndroid: mobileWallet.isAndroid,
    isMobileIOS: mobileWallet.isIOS,
    isMobile: mobileWallet.isMobile,
    platformInfo: {
      walletType: mobileWallet.platformInfo.walletType,
      connectionMethod: mobileWallet.platformInfo.connectionMethod,
    }
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}