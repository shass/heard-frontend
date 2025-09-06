'use client'

import React, { createContext, useContext } from 'react'
import { useAuthCleanup } from '@/hooks/use-auth-cleanup'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useAuthEffects } from '@/hooks/use-auth-effects'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'

// Simplified auth context
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

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected } = useAccount()
  const auth = useAuth()
  const { checkAuth } = useAuthSession()
  
  // Enable global authentication cleanup
  useAuthCleanup()
  
  // Handle all authentication effects
  useAuthEffects({ isConnected, address })

  const contextValue: AuthContextType = {
    login: auth.login,
    logout: auth.logout,
    checkAuth,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    platform: auth.platform,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}