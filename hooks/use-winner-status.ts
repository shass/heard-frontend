'use client'

import { useQuery } from '@tanstack/react-query'
import { winnersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { WinnerStatus } from '@/lib/types'

/**
 * Hook to check if current authenticated user is a winner for a prediction survey
 * @param surveyId - Survey ID to check winner status for
 * @returns React Query result with winner status data
 */
export function useWinnerStatus(surveyId: string | undefined) {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = !!user

  return useQuery<WinnerStatus>({
    queryKey: ['winnerStatus', surveyId],
    queryFn: () => winnersApi.getWinnerStatus(surveyId!),
    enabled: !!surveyId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (not a winner) or 401 (not authenticated)
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    }
  })
}
