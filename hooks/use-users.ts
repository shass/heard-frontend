// React Query hooks for users and HerdPoints

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, type GetHerdPointsHistoryRequest, type UpdateUserRequest, type AdjustHerdPointsRequest } from '@/lib/api/users'
import { useAuth } from './use-auth'
import { useUIStore } from '@/lib/store'
import type { User, HerdPointsTransaction } from '@/lib/types'

// Query keys for cache management
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
  herdPoints: () => [...userKeys.all, 'herd-points'] as const,
  herdPointsHistory: (params: GetHerdPointsHistoryRequest) => [...userKeys.herdPoints(), 'history', params] as const,
  herdPointsSummary: () => [...userKeys.herdPoints(), 'summary'] as const,
}

/**
 * Hook to get current user HerdPoints balance and stats
 */
export function useHerdPoints() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: userKeys.herdPoints(),
    queryFn: () => userApi.getHerdPoints(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get HerdPoints transaction history
 */
export function useHerdPointsHistory(params: GetHerdPointsHistoryRequest = {}) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: userKeys.herdPointsHistory(params),
    queryFn: () => userApi.getHerdPointsHistory(params),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get recent HerdPoints transactions (last 10)
 */
export function useRecentTransactions() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: [...userKeys.herdPoints(), 'recent'],
    queryFn: () => userApi.getRecentTransactions(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get HerdPoints summary for dashboard
 */
export function useHerdPointsSummary() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: userKeys.herdPointsSummary(),
    queryFn: () => userApi.getHerdPointsSummary(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to check if user has enough HerdPoints
 */
export function useHasEnoughPoints(requiredPoints: number) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: [...userKeys.herdPoints(), 'hasEnough', requiredPoints],
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
  const { isAuthenticated } = useAuth()
  
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
export function useUser(userId: string) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
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
  const { user } = useAuth()
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
  const { user } = useAuth()
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
 * Mutation hook to adjust HerdPoints (admin only)
 */
export function useAdjustHerdPoints() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AdjustHerdPointsRequest }) => 
      userApi.adjustHerdPoints(userId, data),
    onSuccess: (result, variables) => {
      // Invalidate HerdPoints caches
      queryClient.invalidateQueries({ queryKey: userKeys.herdPoints() })
      queryClient.invalidateQueries({ queryKey: userKeys.herdPointsSummary() })
      
      // Invalidate user cache
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      
      addNotification({
        type: 'success',
        title: 'HerdPoints adjusted',
        message: `New balance: ${result.newBalance}`,
        duration: 5000
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to adjust HerdPoints',
        message: error.message,
        duration: 5000
      })
    }
  })
}

/**
 * Hook to auto-refresh HerdPoints balance
 */
export function useAutoRefreshHerdPoints(intervalMs: number = 30000) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: [...userKeys.herdPoints(), 'auto-refresh'],
    queryFn: () => userApi.getHerdPoints(),
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
    
    prefetchHerdPoints: () => {
      queryClient.prefetchQuery({
        queryKey: userKeys.herdPoints(),
        queryFn: () => userApi.getHerdPoints(),
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
    invalidateHerdPoints: () => queryClient.invalidateQueries({ queryKey: userKeys.herdPoints() }),
    invalidateUser: (userId: string) => queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  }
}