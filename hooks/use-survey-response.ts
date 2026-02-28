// React Query hooks for survey responses

'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { responseApi, type SubmitAnswerRequest, type SubmitSurveyRequest } from '@/lib/api/responses'
import { surveyKeys } from '@/hooks/use-surveys'
import { useIsAuthenticated, useUIStore } from '@/lib/store'
import type { SurveyResponse, Question } from '@/lib/types'

// Query keys for cache management
export const responseKeys = {
  all: ['responses'] as const,
  details: () => [...responseKeys.all, 'detail'] as const,
  detail: (id: string) => [...responseKeys.details(), id] as const,
  progress: (id: string) => [...responseKeys.detail(id), 'progress'] as const,
}

/**
 * Hook to get survey response details
 * NOTE: Disabled — backend endpoint for response details is not implemented yet.
 * Re-enable when GET /surveys/responses/:id is available on backend.
 */
export function useSurveyResponse(responseId: string) {
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: responseKeys.detail(responseId),
    queryFn: () => responseApi.getResponse(responseId),
    // Disabled: backend endpoint not implemented (getResponse always throws)
    enabled: false,
    staleTime: 30 * 1000, // 30 seconds (frequent updates during survey)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}


/**
 * Mutation hook to submit an answer
 */
export function useSubmitAnswer() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  
  return useMutation({
    mutationFn: (request: SubmitAnswerRequest) => responseApi.submitAnswer(request),
    onSuccess: (data, variables) => {
      // Progress is managed locally in survey page, no need to refetch constantly
      // Only invalidate response details if needed
      queryClient.invalidateQueries({ 
        queryKey: responseKeys.detail(variables.responseId) 
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to save answer',
        message: error.message,
        duration: 5000
      })
    }
  })
}

/**
 * Mutation hook to submit completed survey
 * Accepts surveyId in variables to invalidate eligibility and detail caches after completion.
 */
export function useSubmitSurvey() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (variables: SubmitSurveyRequest & { surveyId?: string }) =>
      responseApi.submitSurvey({ responseId: variables.responseId }),
    onSuccess: (data, variables) => {
      // Clear response caches
      queryClient.removeQueries({
        queryKey: responseKeys.detail(variables.responseId)
      })

      // Invalidate eligibility cache so UI reflects completion immediately
      if (variables.surveyId) {
        queryClient.invalidateQueries({
          queryKey: surveyKeys.detail(variables.surveyId),
        })
        queryClient.invalidateQueries({
          queryKey: surveyKeys.eligibility(variables.surveyId),
          exact: false,
        })
      }

      // Invalidate user points (they got rewarded)
      queryClient.invalidateQueries({
        queryKey: ['users', 'heard-points']
      })

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Survey completed!',
        duration: 10000
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to submit survey',
        message: error.message,
        duration: 5000
      })
    }
  })
}

/**
 * Mutation hook for auto-saving answers
 */
export function useAutoSaveAnswer() {
  return useMutation({
    mutationFn: (request: SubmitAnswerRequest) => responseApi.autoSaveAnswer(request),
    onSuccess: (data) => {
      if (data.saved) {
        console.log('[AutoSave] Answer saved successfully')
      } else {
        console.warn('[AutoSave] Answer save returned saved:false — check API logs')
      }
    },
    // Don't show error notifications for auto-save failures
    onError: () => {
      console.warn('Auto-save failed - will retry on next action')
    }
  })
}

/**
 * Hook for answer validation
 */
export function useAnswerValidation() {
  return {
    validateAnswers: (question: Question, selectedAnswers: string[]) => 
      responseApi.validateAnswers(question, selectedAnswers),
    
    validateRequired: (question: Question, selectedAnswers: string[]) => {
      if (question.isRequired && selectedAnswers.length === 0) {
        return { isValid: false, error: 'This question is required' }
      }
      return { isValid: true }
    },
    
    validateSingleChoice: (question: Question, selectedAnswers: string[]) => {
      if (question.questionType === 'single' && selectedAnswers.length > 1) {
        return { isValid: false, error: 'Only one answer allowed' }
      }
      return { isValid: true }
    }
  }
}

/**
 * Hook to manage survey response state
 */
export function useSurveyResponseState(responseId: string | null, options: { enableResponse?: boolean } = {}) {
  const { enableResponse = true } = options
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()

  // Clear response caches when not authenticated or responseId changes
  React.useEffect(() => {
    if (!isAuthenticated) {
      // Clear ALL response cache on logout to prevent stale data
      queryClient.removeQueries({ queryKey: responseKeys.all })
    } else if (!responseId) {
      // Clear specific response cache when responseId changes
      queryClient.removeQueries({ queryKey: responseKeys.detail('') })
    }
  }, [isAuthenticated, responseId, queryClient])

  const { data: response, isLoading: responseLoading } = useQuery({
    queryKey: responseKeys.detail(responseId || ''),
    queryFn: () => responseApi.getResponse(responseId || ''),
    // Disabled: backend endpoint not implemented (getResponse always throws)
    enabled: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const submitAnswer = useSubmitAnswer()
  const submitSurvey = useSubmitSurvey()
  const autoSave = useAutoSaveAnswer()

  return {
    // Data
    response,

    // Loading states
    isLoading: responseLoading,

    // Actions
    submitAnswer: submitAnswer.mutateAsync,
    submitSurvey: submitSurvey.mutateAsync,
    autoSave: autoSave.mutateAsync,

    // Status
    isSubmittingAnswer: submitAnswer.isPending,
    isSubmittingSurvey: submitSurvey.isPending,
    isAutoSaving: autoSave.isPending,
  }
}

/**
 * Hook to prefetch response data
 * NOTE: No-op — backend endpoint for response details is not implemented yet.
 * Re-enable when GET /surveys/responses/:id is available on backend.
 */
export function usePrefetchResponse() {
  return {
    prefetchResponse: (_responseId: string) => {
      // No-op: backend endpoint not implemented (getResponse always throws)
    }
  }
}
