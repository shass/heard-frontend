'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'

/**
 * Auth Error Tracker - Intercepts and displays auth errors on mobile
 */
export function AuthErrorTracker() {
  const { error, isLoading, isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    // Track auth state changes
    const authState = {
      error,
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      timestamp: new Date().toISOString()
    }

    console.group('🔐 [AuthState] State Changed')
    console.log('State:', authState)
    if (error) {
      console.error('❌ Auth Error:', error)
    }
    if (user) {
      console.log('👤 User:', {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role
      })
    }
    console.groupEnd()

    // Show visual alert on error for mobile debugging
    if (error && typeof window !== 'undefined') {
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        padding: 12px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 12px;
        max-height: 200px;
        overflow: auto;
      `
      errorDiv.innerHTML = `
        <strong>🚨 Auth Error:</strong><br/>
        ${error}<br/>
        <small>${new Date().toLocaleTimeString()}</small>
      `
      document.body.appendChild(errorDiv)

      setTimeout(() => {
        document.body.removeChild(errorDiv)
      }, 5000)
    }
  }, [error, isLoading, isAuthenticated, user])

  // Intercept fetch errors
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)

        // Log auth-related requests
        const url = args[0] as string
        if (url.includes('/auth/')) {
          console.group(`📡 [Fetch] ${url}`)
          console.log('Status:', response.status)
          console.log('OK:', response.ok)

          // Clone response to read body without consuming it
          const clonedResponse = response.clone()
          try {
            const data = await clonedResponse.json()
            console.log('Response:', data)
          } catch (e) {
            console.log('Response: (not JSON)')
          }
          console.groupEnd()
        }

        return response
      } catch (err) {
        console.error('🚨 [Fetch Error]', args[0], err)
        throw err
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
