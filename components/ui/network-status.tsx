'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNotifications } from '@/components/ui/notifications'

interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const notifications = useNotifications()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        notifications.success(
          'Connection restored',
          'You are back online',
          { duration: 3000 }
        )
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      notifications.error(
        'Connection lost',
        'You are currently offline. Some features may not work.',
        { duration: 5000 }
      )
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline, notifications])

  if (isOnline) {
    return null // Don't show anything when online
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-2 text-center text-sm ${className}`}>
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>You are offline. Some features may not work.</span>
      </div>
    </div>
  )
}

// Hook for using network status in components
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection?.effectiveType || null)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType
  }
}

// Component to show network quality indicator
export function NetworkQualityIndicator({ className }: { className?: string }) {
  const { isOnline, connectionType } = useNetworkStatus()

  if (!isOnline) {
    return (
      <div className={`flex items-center space-x-1 text-red-600 ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span className="text-xs">Offline</span>
      </div>
    )
  }

  const getConnectionQuality = () => {
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        return { color: 'text-red-600', label: 'Slow' }
      case '3g':
        return { color: 'text-yellow-600', label: 'Fair' }
      case '4g':
        return { color: 'text-green-600', label: 'Good' }
      default:
        return { color: 'text-green-600', label: 'Good' }
    }
  }

  const quality = getConnectionQuality()

  return (
    <div className={`flex items-center space-x-1 ${quality.color} ${className}`}>
      <Wifi className="w-4 h-4" />
      <span className="text-xs">{quality.label}</span>
    </div>
  )
}

// Hook for handling offline-first data
export function useOfflineFirst<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    refreshInterval?: number
    fallbackData?: T
  } = {}
) {
  const [data, setData] = useState<T | null>(options.fallbackData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const { isOnline } = useNetworkStatus()

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        const parsed = JSON.parse(cached)
        setData(parsed.data)
        setLastFetch(new Date(parsed.timestamp))
      }
    } catch (e) {
      console.warn('Failed to parse cached data:', e)
    }
  }, [key])

  // Fetch data function
  const fetchData = async (force = false) => {
    if (!isOnline && !force) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      setLastFetch(new Date())
      
      // Cache the result
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify({
            data: result,
            timestamp: new Date().toISOString()
          }))
        } catch (e) {
          console.warn('Failed to cache data:', e)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh when coming back online
  useEffect(() => {
    if (isOnline && data === null) {
      fetchData()
    }
  }, [isOnline])

  // Refresh interval
  useEffect(() => {
    if (options.refreshInterval && isOnline) {
      const interval = setInterval(() => {
        fetchData()
      }, options.refreshInterval)

      return () => clearInterval(interval)
    }
  }, [options.refreshInterval, isOnline])

  return {
    data,
    loading,
    error,
    lastFetch,
    refetch: () => fetchData(true),
    isStale: lastFetch ? Date.now() - lastFetch.getTime() > 5 * 60 * 1000 : true // 5 minutes
  }
}