import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { ApiError, type LinkdropReward } from '@/lib/types'

export function useUserReward(surveyId: string, isAuthenticated?: boolean) {
  return useQuery<LinkdropReward>({
    queryKey: ['user-reward', surveyId],
    queryFn: async () => {
      return await apiClient.get<LinkdropReward>(`/surveys/${surveyId}/my-reward`)
    },
    enabled: !!surveyId && isAuthenticated === true,
    retry: (failureCount, error) => {
      // Don't retry if survey not completed or no reward available
      if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 401)) {
        return false
      }
      return failureCount < 3
    }
  })
}
