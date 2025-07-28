'use client'

import { useEffect, useState, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useAuthStore } from '@/lib/store'

interface MobileWalletState {
  isMobile: boolean
  isAndroid: boolean
  isIOS: boolean
  isMetaMaskMobile: boolean
  isTrustWallet: boolean
  isWaitingForSignature: boolean
  platformInfo: {
    userAgent: string
    walletType: 'metamask' | 'trust' | 'coinbase' | 'unknown'
    connectionMethod: 'injected' | 'walletconnect' | 'unknown'
  }
}

export function useMobileWallet() {
  const { address, isConnected } = useAccount()
  const { setUser, isAuthenticated } = useAuthStore()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [state, setState] = useState<MobileWalletState>({
    isMobile: false,
    isAndroid: false,
    isIOS: false,
    isMetaMaskMobile: false,
    isTrustWallet: false,
    isWaitingForSignature: false,
    platformInfo: {
      userAgent: '',
      walletType: 'unknown',
      connectionMethod: 'unknown'
    }
  })

  // Enhanced mobile platform detection on mount
  useEffect(() => {
    const userAgent = navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
    
    // Enhanced wallet detection
    const ethereum = (window as any).ethereum
    const isMetaMaskMobile = !!(ethereum?.isMetaMask && isMobile)
    const isTrustWallet = !!(ethereum?.isTrust && isMobile)
    
    // Determine wallet type
    let walletType: 'metamask' | 'trust' | 'coinbase' | 'unknown' = 'unknown'
    if (ethereum?.isMetaMask) walletType = 'metamask'
    else if (ethereum?.isTrust) walletType = 'trust'
    else if (ethereum?.isCoinbaseWallet) walletType = 'coinbase'
    
    // Determine connection method (simplified)
    const connectionMethod = ethereum ? 'injected' : 'unknown'

    console.log('📱 Mobile wallet detection:', {
      isMobile,
      isAndroid,
      isIOS,
      walletType,
      connectionMethod,
      userAgent: userAgent.substring(0, 100) + '...'
    })

    setState(prev => ({
      ...prev,
      isMobile,
      isAndroid,
      isIOS,
      isMetaMaskMobile,
      isTrustWallet,
      platformInfo: {
        userAgent,
        walletType,
        connectionMethod
      }
    }))
  }, [])

  // Start polling for auth status (mobile fallback) with improved error handling
  const startAuthPolling = (onSuccess?: () => void) => {
    if (pollingIntervalRef.current) {
      console.log('⚠️ Polling already active, skipping duplicate start')
      return // Already polling
    }

    console.log('🔄 Starting auth status polling for mobile wallet')
    let attemptCount = 0
    const maxAttempts = 15 // 30 seconds with 2-second intervals
    
    pollingIntervalRef.current = setInterval(async () => {
      attemptCount++
      
      try {
        const { authApi } = await import('@/lib/api/auth')
        const userData = await authApi.checkAuth()
        
        if (userData && userData.walletAddress?.toLowerCase() === address?.toLowerCase()) {
          console.log('✅ Polling detected successful authentication after', attemptCount, 'attempts!')
          
          // Only update if not already authenticated to avoid race conditions
          if (!isAuthenticated) {
            setUser(userData)
          }
          
          stopAuthPolling()
          setIsWaitingForSignature(false)
          
          // Call success callback if provided
          if (onSuccess) {
            onSuccess()
          }
          return
        }
        
        // Stop polling after max attempts to prevent infinite polling
        if (attemptCount >= maxAttempts) {
          console.log('⏰ Polling timeout after', maxAttempts, 'attempts')
          stopAuthPolling()
          setIsWaitingForSignature(false)
        }
        
      } catch (error: any) {
        // Continue polling on error, but log for debugging
        console.log(`🔄 Auth polling attempt ${attemptCount}/${maxAttempts} failed:`, error?.status || 'unknown error')
        
        // Stop polling after max attempts even on errors
        if (attemptCount >= maxAttempts) {
          console.log('⏰ Polling timeout due to persistent errors')
          stopAuthPolling()
          setIsWaitingForSignature(false)
        }
      }
    }, 2000) // Check every 2 seconds
  }

  // Stop auth polling
  const stopAuthPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      console.log('⏹️ Stopped auth status polling')
    }
  }

  // Set waiting for signature state
  const setIsWaitingForSignature = (waiting: boolean) => {
    setState(prev => ({ ...prev, isWaitingForSignature: waiting }))
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopAuthPolling()
  }, [])

  // Create mobile-aware polling that returns a promise for auth completion
  const startMobileAuthPolling = () => {
    return new Promise<void>((resolve, reject) => {
      if (!state.isMobile) {
        console.log('ℹ️ Desktop device, no special polling needed')
        resolve() // Not mobile, no special handling needed
        return
      }

      // Use shorter timeout for iOS due to different behavior
      const timeoutDuration = state.isIOS ? 20000 : 30000 // 20s for iOS, 30s for Android
      const platformName = state.isIOS ? 'iOS' : state.isAndroid ? 'Android' : 'Mobile'
      
      console.log(`📱 ${platformName} detected (${state.platformInfo.walletType}), starting enhanced mobile polling`)
      console.log(`⏰ Timeout set to ${timeoutDuration/1000} seconds for ${platformName}`)
      
      const pollTimeout = setTimeout(() => {
        console.log(`⏰ Mobile auth polling timeout after ${timeoutDuration/1000} seconds on ${platformName}`)
        stopAuthPolling()
        setIsWaitingForSignature(false)
        const errorMsg = state.isIOS 
          ? 'Authentication timeout. On iOS, please switch back to your wallet app to complete signing, then return to this page.'
          : 'Authentication timeout. Please check if you signed the message in your wallet, then refresh the page or try again.'
        reject(new Error(errorMsg))
      }, timeoutDuration)
      
      // Start polling with success callback
      startAuthPolling(() => {
        console.log('✅ Mobile polling authentication successful')
        clearTimeout(pollTimeout)
        resolve()
      })
      
      // Backup check if auth completed during polling (redundant safety)
      const checkInterval = setInterval(() => {
        if (isAuthenticated || !pollingIntervalRef.current) {
          clearTimeout(pollTimeout)
          clearInterval(checkInterval)
          if (isAuthenticated) {
            console.log('✅ Authentication confirmed via backup check')
            resolve()
          } else if (!pollingIntervalRef.current) {
            // Polling stopped but no auth - likely timeout
            console.log('❌ Polling stopped without authentication')
            setIsWaitingForSignature(false)
            reject(new Error('Authentication timeout'))
          }
        }
      }, 1000)
    })
  }

  return {
    ...state,
    startAuthPolling,
    stopAuthPolling,
    setIsWaitingForSignature,
    startMobileAuthPolling
  }
}