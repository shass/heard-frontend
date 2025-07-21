// React Query hooks for users and HeardPoints

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, type GetHeardPointsHistoryRequest, type UpdateUserRequest, type AdjustHeardPointsRequest } from '@/lib/api/users'
import { useUIStore, useIsAuthenticated, useUser } from '@/lib/store'
import type { User, HeardPointsTransaction } from '@/lib/types'

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
 * Hook to get recent HeardPoints transactions (last 10)
 */
export function useRecentTransactions() {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: [...userKeys.heardPoints(), 'recent'],
    queryFn: () => userApi.getRecentTransactions(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get HeardPoints summary for dashboard
 */
export function useHeardPointsSummary() {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: userKeys.heardPointsSummary(),
    queryFn: () => userApi.getHeardPointsSummary(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to check if user has enough HeardPoints
 */
export function useHasEnoughPoints(requiredPoints: number) {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: [...userKeys.heardPoints(), 'hasEnough', requiredPoints],
    queryFn: () => userApi.hasEnoughPoints(requiredPoints),
    enabled: isAuthenticated && requiredPoints > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get current user profile
 */
export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => userApi.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Hook to get user by ID (admin only)
 */
export function useUserById(userId: string) {
  const currentUser = useUser()
  const isAdmin = currentUser?.role === 'admin'
  
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userApi.getUser(userId),
    enabled: !!userId && isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Hook to get all users with filtering (admin only)
 */
export function useAllUsers(params: Parameters<typeof userApi.getAllUsers>[0] = {}) {
  const user = useUser()
  const isAdmin = user?.role === 'admin'
  
  return useQuery({
    queryKey: [...userKeys.lists(), params],
    queryFn: () => userApi.getAllUsers(params),
    enabled: isAdmin,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to search users (admin only)
 */
export function useSearchUsers(query: string, params: Parameters<typeof userApi.getAllUsers>[0] = {}) {
  const user = useUser()
  const isAdmin = user?.role === 'admin'
  
  return useQuery({
    queryKey: [...userKeys.lists(), 'search', query, params],
    queryFn: () => userApi.searchUsers(query, params),
    enabled: isAdmin && query.length > 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Mutation hook to update user (admin only)
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRequest }) => 
      userApi.updateUser(userId, data),
    onSuccess: (updatedUser, variables) => {
      // Update user cache
      queryClient.setQueryData(userKeys.detail(variables.userId), updatedUser)
      
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'User updated successfully',
        duration: 3000
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to update user',
        message: error.message,
        duration: 5000
      })
    }
  })
}

/**
 * Mutation hook to adjust HeardPoints (admin only)
 */
export function useAdjustHeardPoints() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AdjustHeardPointsRequest }) => 
      userApi.adjustHeardPoints(userId, data),
    onSuccess: (result, variables) => {
      // Invalidate HeardPoints caches
      queryClient.invalidateQueries({ queryKey: userKeys.heardPoints() })
      queryClient.invalidateQueries({ queryKey: userKeys.heardPointsSummary() })
      
      // Invalidate user cache
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      
      addNotification({
        type: 'success',
        title: 'HeardPoints adjusted',
        message: `New balance: ${result.newBalance}`,
        duration: 5000
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to adjust HeardPoints',
        message: error.message,
        duration: 5000
      })
    }
  })
}

/**
 * Hook to auto-refresh HeardPoints balance
 */
export function useAutoRefreshHeardPoints(intervalMs: number = 30000) {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: [...userKeys.heardPoints(), 'auto-refresh'],
    queryFn: () => userApi.getHeardPoints(),
    enabled: isAuthenticated,
    refetchInterval: intervalMs,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook to prefetch user data
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient()
  
  return {
    prefetchUser: (userId: string) => {
      queryClient.prefetchQuery({
        queryKey: userKeys.detail(userId),
        queryFn: () => userApi.getUser(userId),
        staleTime: 5 * 60 * 1000,
      })
    },
    
    prefetchHeardPoints: () => {
      queryClient.prefetchQuery({
        queryKey: userKeys.heardPoints(),
        queryFn: () => userApi.getHeardPoints(),
        staleTime: 1 * 60 * 1000,
      })
    }
  }
}

/**
 * Hook to invalidate user caches
 */
export function useInvalidateUsers() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    invalidateHeardPoints: () => queryClient.invalidateQueries({ queryKey: userKeys.heardPoints() }),
    invalidateUser: (userId: string) => queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  }
}
