// React Query hooks for surveys

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { surveyApi, type GetSurveysRequest, type StartSurveyRequest } from '@/lib/api/surveys'
import { useIsAuthenticated } from '@/lib/store'
import type { Survey, Question, EligibilityResponse } from '@/lib/types'

// Query keys for cache management
export const surveyKeys = {
  all: ['surveys'] as const,
  lists: () => [...surveyKeys.all, 'list'] as const,
  list: (params: GetSurveysRequest) => [...surveyKeys.lists(), params] as const,
  details: () => [...surveyKeys.all, 'detail'] as const,
  detail: (id: string) => [...surveyKeys.details(), id] as const,
  questions: (id: string) => [...surveyKeys.detail(id), 'questions'] as const,
  eligibility: (id: string, walletAddress?: string) => [...surveyKeys.detail(id), 'eligibility', walletAddress] as const,
}

/**
 * Hook to get list of surveys with caching and pagination
 */
export function useSurveys(params: GetSurveysRequest = {}) {
  return useQuery({
    queryKey: surveyKeys.list(params),
    queryFn: () => surveyApi.getSurveys(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get active surveys (public, no auth required)
 */
export function useActiveSurveys(params: { 
  limit?: number
  offset?: number
  company?: string
} = {}) {
  return useQuery({
    queryKey: surveyKeys.list({ ...params, status: 'active' }),
    queryFn: () => surveyApi.getActiveSurveys(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get survey details by ID
 */
export function useSurvey(id: string) {
  return useQuery({
    queryKey: surveyKeys.detail(id),
    queryFn: () => surveyApi.getSurvey(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get survey questions (requires auth)
 */
export function useSurveyQuestions(id: string) {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: surveyKeys.questions(id),
    queryFn: () => surveyApi.getQuestions(id),
    enabled: !!id && isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to check survey eligibility
 * Only makes request if both id and walletAddress are provided
 */
export function useSurveyEligibility(id: string, walletAddress?: string) {
  return useQuery({
    queryKey: surveyKeys.eligibility(id, walletAddress),
    queryFn: () => surveyApi.checkEligibility(id, { walletAddress }),
    enabled: !!id && !!walletAddress,
    staleTime: 0, // Always fetch fresh data
    gcTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to search surveys
 */
export function useSearchSurveys(query: string, params: GetSurveysRequest = {}) {
  return useQuery({
    queryKey: [...surveyKeys.lists(), 'search', query, params],
    queryFn: () => surveyApi.searchSurveys(query, params),
    enabled: query.length > 2, // Only search if query is meaningful
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get surveys by company
 */
export function useSurveysByCompany(company: string, params: GetSurveysRequest = {}) {
  return useQuery({
    queryKey: [...surveyKeys.lists(), 'company', company, params],
    queryFn: () => surveyApi.getSurveysByCompany(company, params),
    enabled: !!company,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Mutation hook to start a survey
 */
export function useStartSurvey(callbacks?: {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request?: StartSurveyRequest }) => 
      surveyApi.startSurvey(id, request),
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError
  })
}

/**
 * Hook to prefetch survey data
 */
export function usePrefetchSurvey() {
  const queryClient = useQueryClient()
  
  return {
    prefetchSurvey: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: surveyKeys.detail(id),
        queryFn: () => surveyApi.getSurvey(id),
        staleTime: 5 * 60 * 1000,
      })
    },
    
    prefetchQuestions: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: surveyKeys.questions(id),
        queryFn: () => surveyApi.getQuestions(id),
        staleTime: 10 * 60 * 1000,
      })
    }
  }
}

/**
 * Hook to get cached survey data without triggering request
 */
export function useCachedSurvey(id: string): Survey | undefined {
  const queryClient = useQueryClient()
  return queryClient.getQueryData(surveyKeys.detail(id))
}

/**
 * Hook to invalidate survey caches
 */
export function useInvalidateSurveys() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: surveyKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: surveyKeys.lists() }),
    invalidateSurvey: (id: string) => queryClient.invalidateQueries({ queryKey: surveyKeys.detail(id) }),
  }
}

/**
 * Hook to check eligibility for multiple surveys at once
 * Optimizes network requests by batching eligibility checks
 */
export function useBatchSurveyEligibility(
  surveyIds: string[],
  walletAddress?: string
) {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: [...surveyKeys.all, 'batch-eligibility', surveyIds, walletAddress],
    queryFn: async () => {
      if (!walletAddress || surveyIds.length === 0) return {}
      
      // Make parallel requests for all surveys
      const results = await Promise.all(
        surveyIds.map(async (id) => {
          try {
            const result = await surveyApi.checkEligibility(id, { walletAddress })
            return { id, ...result }
          } catch (error) {
            console.error(`Eligibility check failed for survey ${id}:`, error)
            return { id, isEligible: false, reason: 'Check failed' }
          }
        })
      )
      
      // Convert array to object for easy lookup
      return results.reduce((acc, result) => {
        acc[result.id] = result
        return acc
      }, {} as Record<string, any>)
    },
    enabled: isAuthenticated && !!walletAddress && surveyIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}