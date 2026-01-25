import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { LinkdropReward } from '@/lib/types'

export function useUserReward(surveyId: string, isAuthenticated?: boolean) {
  return useQuery<LinkdropReward>({
    queryKey: ['user-reward', surveyId],
    queryFn: async () => {
      return await apiClient.get<LinkdropReward>(`/surveys/${surveyId}/my-reward`)
    },
    enabled: !!surveyId && isAuthenticated === true,
    retry: (failureCount, error: any) => {
      // Don't retry if survey not completed or no reward available
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    }
  })
}
