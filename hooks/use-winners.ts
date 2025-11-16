// React Query hooks for winners management (Time-Limited Surveys)

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { winnersApi, type GetWinnersParams } from '@/lib/api/winners'
import type { WinnersPagedData, AddWinnersRequest } from '@/lib/types'
import { useAuth } from '@/src/platforms'
import { toast } from 'sonner'

// Query keys for cache management
export const winnerKeys = {
  all: ['winners'] as const,
  lists: () => [...winnerKeys.all, 'list'] as const,
  list: (surveyId: string, params?: GetWinnersParams) =>
    [...winnerKeys.lists(), surveyId, params] as const,
}

/**
 * Hook to get paginated list of winners for a survey (Admin only)
 * @param surveyId - Survey ID
 * @param params - Pagination parameters (limit, offset)
 * @returns React Query result with winners data
 */
export function useWinners(surveyId: string, params: GetWinnersParams = {}) {
  const auth = useAuth()
  const isAdmin = auth.user?.metadata?.role === 'admin'

  return useQuery<WinnersPagedData>({
    queryKey: winnerKeys.list(surveyId, params),
    queryFn: () => winnersApi.getWinners(surveyId, params),
    enabled: !!surveyId && isAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to add winners to a survey in bulk (Admin only)
 * Accepts JSON array with winner entries
 * @returns Mutation function to add winners
 */
export function useAddWinners() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      surveyId,
      request
    }: {
      surveyId: string
      request: AddWinnersRequest
    }) =>
      winnersApi.addWinners(surveyId, request),
    onSuccess: (data, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: winnerKeys.lists() })

      const { added, failed } = data
      if (added > 0 && failed === 0) {
        toast.success(`Successfully added ${added} winner${added > 1 ? 's' : ''}`)
      } else if (added > 0 && failed > 0) {
        toast.success(`Added ${added} winner${added > 1 ? 's' : ''}, ${failed} failed`)
      } else {
        toast.error(`Failed to add winners: ${failed} failed`)
      }
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to add winners')
    }
  })
}

/**
 * Hook to remove a specific winner from a survey (Admin only)
 * @returns Mutation function to remove winner
 */
export function useRemoveWinner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      surveyId,
      winnerId
    }: {
      surveyId: string
      winnerId: string
    }) =>
      winnersApi.removeWinner(surveyId, winnerId),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: winnerKeys.lists() })
      toast.success('Winner removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to remove winner')
    }
  })
}

/**
 * Hook to remove all winners from a survey (Admin only)
 * @returns Mutation function to remove all winners
 */
export function useRemoveAllWinners() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (surveyId: string) =>
      winnersApi.removeAllWinners(surveyId),
    onSuccess: (_, surveyId) => {
      queryClient.invalidateQueries({ queryKey: winnerKeys.lists() })
      toast.success('All winners removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to remove all winners')
    }
  })
}

/**
 * Utility hook to manually invalidate winners cache
 * @returns Object with invalidation functions
 */
export function useInvalidateWinners() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: winnerKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: winnerKeys.lists() }),
    invalidateList: (surveyId: string, params?: GetWinnersParams) =>
      queryClient.invalidateQueries({ queryKey: winnerKeys.list(surveyId, params) }),
  }
}
