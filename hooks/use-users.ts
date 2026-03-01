// React Query hooks for users and HeardPoints

'use client'

import { useQuery } from '@tanstack/react-query'
import { userApi, type GetHeardPointsHistoryRequest } from '@/lib/api/users'
import { useIsAuthenticated } from '@/lib/store'

// Query keys for cache management
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
  heardPoints: () => [...userKeys.all, 'heard-points'] as const,
  heardPointsHistory: (params: GetHeardPointsHistoryRequest) => [...userKeys.heardPoints(), 'history', params] as const,
  heardPointsSummary: () => [...userKeys.heardPoints(), 'summary'] as const,
}

/**
 * Hook to get current user HeardPoints balance and stats
 */
export function useHeardPoints() {
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: userKeys.heardPoints(),
    queryFn: () => userApi.getHeardPoints(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get HeardPoints transaction history
 */
export function useHeardPointsHistory(params: GetHeardPointsHistoryRequest = {}) {
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: userKeys.heardPointsHistory(params),
    queryFn: () => userApi.getHeardPointsHistory(params),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to auto-refresh HeardPoints balance
 */
export function useAutoRefreshHeardPoints(intervalMs: number = 30000) {
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: userKeys.heardPoints(),
    queryFn: () => userApi.getHeardPoints(),
    enabled: isAuthenticated,
    refetchInterval: intervalMs,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 1 * 60 * 1000, // 1 minute
  })
}
