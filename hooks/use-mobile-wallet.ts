'use client'

import { useEffect, useState, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useAuthStore } from '@/lib/store'

interface MobileWalletState {
  isMobile: boolean
  isAndroid: boolean
  isMetaMaskMobile: boolean
  isWaitingForSignature: boolean
}

export function useMobileWallet() {
  const { address, isConnected } = useAccount()
  const { setUser, isAuthenticated } = useAuthStore()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [state, setState] = useState<MobileWalletState>({
    isMobile: false,
    isAndroid: false,
    isMetaMaskMobile: false,
    isWaitingForSignature: false
  })

  // Detect mobile platform on mount
  useEffect(() => {
    const userAgent = navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    const isMetaMaskMobile = !!(window as any).ethereum?.isMetaMask && isMobile

    setState(prev => ({
      ...prev,
      isMobile,
      isAndroid,
      isMetaMaskMobile
    }))
  }, [])

  // Start polling for auth status (mobile fallback)
  const startAuthPolling = (onSuccess?: () => void) => {
    if (pollingIntervalRef.current) return // Already polling

    console.log('🔄 Starting auth status polling for mobile wallet')
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { authApi } = await import('@/lib/api/auth')
        const userData = await authApi.checkAuth()
        
        if (userData && userData.walletAddress?.toLowerCase() === address?.toLowerCase()) {
          console.log('✅ Polling detected successful authentication!')
          
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
        }
      } catch (error) {
        // Continue polling on error
        console.log('🔄 Auth polling check failed, continuing...')
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
      if (!state.isAndroid) {
        resolve() // Not Android, no special handling needed
        return
      }

      console.log('🔄 Android detected, starting backup polling')
      
      const pollTimeout = setTimeout(() => {
        stopAuthPolling()
        setIsWaitingForSignature(false)
        reject(new Error('Authentication timeout. Please try connecting your wallet again.'))
      }, 30000) // 30 second timeout for polling
      
      // Start polling with success callback
      startAuthPolling(() => {
        clearTimeout(pollTimeout)
        resolve()
      })
      
      // Check if auth completed during polling
      const checkInterval = setInterval(() => {
        if (isAuthenticated || !pollingIntervalRef.current) {
          clearTimeout(pollTimeout)
          clearInterval(checkInterval)
          if (isAuthenticated) {
            resolve()
          } else {
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