// React Query hooks for survey responses

'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { responseApi, type SubmitAnswerRequest, type SubmitSurveyRequest } from '@/lib/api/responses'
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
 */
export function useSurveyResponse(responseId: string) {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: responseKeys.detail(responseId),
    queryFn: () => responseApi.getResponse(responseId),
    enabled: !!responseId && isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds (frequent updates during survey)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get survey response progress
 */
export function useSurveyProgress(responseId: string) {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: responseKeys.progress(responseId),
    queryFn: () => responseApi.getProgress(responseId),
    enabled: !!responseId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes (manual refresh only)
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Removed refetchInterval - progress is managed locally in survey page
  })
}

/**
 * Hook to check if user can continue survey response
 */
export function useCanContinueSurvey(responseId: string) {
  const isAuthenticated = useIsAuthenticated()
  
  return useQuery({
    queryKey: [...responseKeys.detail(responseId), 'canContinue'],
    queryFn: () => responseApi.canContinue(responseId),
    enabled: !!responseId && isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
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
 */
export function useSubmitSurvey() {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  
  return useMutation({
    mutationFn: (request: SubmitSurveyRequest) => responseApi.submitSurvey(request),
    onSuccess: (data, variables) => {
      // Clear response caches
      queryClient.removeQueries({ 
        queryKey: responseKeys.detail(variables.responseId) 
      })
      
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
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: SubmitAnswerRequest) => responseApi.autoSaveAnswer(request),
    onSuccess: (data, variables) => {
      if (data.saved) {
        // Silently update cache without notifications
        queryClient.invalidateQueries({ 
          queryKey: responseKeys.progress(variables.responseId) 
        })
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
export function useSurveyResponseState(responseId: string | null, options: { enableProgress?: boolean, enableResponse?: boolean } = {}) {
  const { enableProgress = false, enableResponse = true } = options
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  
  // Clear response caches when not authenticated or responseId changes
  React.useEffect(() => {
    if (!isAuthenticated || !responseId) {
      // Clear all response-related queries when authentication is lost
      queryClient.removeQueries({ queryKey: responseKeys.all })
    }
  }, [isAuthenticated, responseId, queryClient])
  
  const { data: response, isLoading: responseLoading } = useQuery({
    queryKey: responseKeys.detail(responseId || ''),
    queryFn: () => responseApi.getResponse(responseId || ''),
    enabled: !!responseId && isAuthenticated && enableResponse,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: responseKeys.progress(responseId || ''),
    queryFn: () => responseApi.getProgress(responseId || ''),
    enabled: !!responseId && isAuthenticated && enableProgress,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
  const { data: canContinue } = useCanContinueSurvey(responseId || '')
  
  const submitAnswer = useSubmitAnswer()
  const submitSurvey = useSubmitSurvey()
  const autoSave = useAutoSaveAnswer()
  
  return {
    // Data
    response,
    progress,
    canContinue: canContinue?.canContinue ?? false,
    
    // Loading states
    isLoading: responseLoading || progressLoading,
    
    // Actions
    submitAnswer: submitAnswer.mutateAsync,
    submitSurvey: submitSurvey.mutateAsync,
    autoSave: autoSave.mutateAsync,
    
    // Status
    isSubmittingAnswer: submitAnswer.isPending,
    isSubmittingSurvey: submitSurvey.isPending,
    isAutoSaving: autoSave.isPending,
    
    // Computed properties
    isCompleted: progress?.percentComplete === 100,
    canSubmitSurvey: progress?.canSubmit ?? false,
    currentQuestionNumber: progress?.currentQuestion ?? 1,
    totalQuestions: progress?.totalQuestions ?? 0,
  }
}

/**
 * Hook to prefetch response data
 */
export function usePrefetchResponse() {
  const queryClient = useQueryClient()
  
  return {
    prefetchResponse: (responseId: string) => {
      queryClient.prefetchQuery({
        queryKey: responseKeys.detail(responseId),
        queryFn: () => responseApi.getResponse(responseId),
        staleTime: 30 * 1000,
      })
    },
    
    prefetchProgress: (responseId: string) => {
      queryClient.prefetchQuery({
        queryKey: responseKeys.progress(responseId),
        queryFn: () => responseApi.getProgress(responseId),
        staleTime: 10 * 1000,
      })
    }
  }
}
