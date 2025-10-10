'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'

/**
 * Network Error Tracker - Intercepts and displays ALL network errors on mobile
 * Tracks: HTTP errors, Network failures, Auth state changes
 */
export function NetworkErrorTracker() {
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

  // Intercept ALL fetch requests and errors
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const url = args[0] as string
      const startTime = Date.now()

      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime

        // Log ALL requests with status
        const isError = !response.ok
        const logLevel = isError ? 'error' : 'log'
        const emoji = isError ? '❌' : '✅'

        console.groupCollapsed(
          `${emoji} [${response.status}] ${url} (${duration}ms)`
        )
        console.log('Method:', args[1]?.method || 'GET')
        console.log('Status:', response.status, response.statusText)
        console.log('OK:', response.ok)
        console.log('Duration:', `${duration}ms`)

        // Log request details
        if (args[1]) {
          console.log('Request:', {
            method: args[1].method,
            headers: args[1].headers,
            body: args[1].body
          })
        }

        // Clone response to read body without consuming it
        const clonedResponse = response.clone()
        try {
          const data = await clonedResponse.json()
          console.log('Response:', data)

          // Show error details prominently
          if (isError && data?.error) {
            console.error('Error Details:', data.error)
          }
        } catch (e) {
          console.log('Response: (not JSON)')
        }
        console.groupEnd()

        // Show visual alert for ALL errors (not just auth)
        if (isError && typeof window !== 'undefined') {
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

          let errorMessage = `${response.status} ${response.statusText}`
          try {
            const errorData = await response.clone().json()
            if (errorData?.error?.message) {
              errorMessage = errorData.error.message
            }
          } catch (e) {
            // Use status text
          }

          errorDiv.innerHTML = `
            <strong>🚨 HTTP Error [${response.status}]:</strong><br/>
            ${url}<br/>
            ${errorMessage}<br/>
            <small>${new Date().toLocaleTimeString()}</small>
          `
          document.body.appendChild(errorDiv)

          setTimeout(() => {
            if (document.body.contains(errorDiv)) {
              document.body.removeChild(errorDiv)
            }
          }, 5000)
        }

        return response
      } catch (err) {
        const duration = Date.now() - startTime
        console.error(`🚨 [Network Error] ${url} (${duration}ms)`, err)

        // Show visual alert for network errors
        if (typeof window !== 'undefined') {
          const errorDiv = document.createElement('div')
          errorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            background: #cc0000;
            color: white;
            padding: 12px;
            border-radius: 8px;
            z-index: 9999;
            font-size: 12px;
            max-height: 200px;
            overflow: auto;
          `
          errorDiv.innerHTML = `
            <strong>🔌 Network Error:</strong><br/>
            ${url}<br/>
            ${err instanceof Error ? err.message : String(err)}<br/>
            <small>${new Date().toLocaleTimeString()}</small>
          `
          document.body.appendChild(errorDiv)

          setTimeout(() => {
            if (document.body.contains(errorDiv)) {
              document.body.removeChild(errorDiv)
            }
          }, 5000)
        }

        throw err
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
