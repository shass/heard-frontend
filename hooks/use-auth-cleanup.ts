// Hook to handle cleanup when authentication changes

'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useIsAuthenticated } from '@/lib/store'

/**
 * Hook that clears React Query caches when authentication state changes
 * This prevents stale data from previous authentication sessions
 */
export function useAuthCleanup() {
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all authentication-dependent caches when user logs out
      queryClient.removeQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey
          if (!Array.isArray(queryKey)) return false
          
          // Clear response-related queries
          if (queryKey[0] === 'responses') return true
          
          // Clear authenticated survey queries
          if (queryKey[0] === 'surveys' && queryKey.includes('questions')) return true
          
          // Clear user-specific data
          if (queryKey[0] === 'users') return true
          
          // Clear admin data
          if (queryKey[0] === 'admin') return true
          
          return false
        }
      })
    }
  }, [isAuthenticated, queryClient])
}