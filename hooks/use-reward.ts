import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { type LinkdropReward } from '@/lib/types'

export function useUserReward(surveyId: string, isAuthenticated?: boolean) {
  return useQuery<LinkdropReward>({
    queryKey: ['user-reward', surveyId],
    queryFn: async () => {
      return await apiClient.get<LinkdropReward>(`/surveys/${surveyId}/my-reward`)
    },
    enabled: !!surveyId && isAuthenticated === true,
  })
}
