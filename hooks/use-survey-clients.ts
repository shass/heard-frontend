// React Query hooks for survey clients and results

'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  surveyClientsApi, 
  surveyResultsApi,
  type AddSurveyClientRequest,
  type UpdateSurveyClientRequest,
  type UpdateVisibilityRequest,
  type SurveyClient,
  type SurveyVisibilityInfo,
  type SurveyResultsResponse,
  type QuestionWithAnswers
} from '@/lib/api/survey-clients'
import { useAuth } from '@/src/platforms'
import { toast } from 'sonner'

// Query keys for cache management
export const surveyClientKeys = {
  all: ['survey-clients'] as const,
  clients: (surveyId: string) => [...surveyClientKeys.all, 'clients', surveyId] as const,
  visibility: (surveyId: string) => [...surveyClientKeys.all, 'visibility', surveyId] as const,
  results: (surveyId: string, token?: string) => ['survey-results', surveyId, token] as const,
  questions: (surveyId: string) => ['survey-questions', surveyId] as const,
}

// Admin hooks for managing survey clients
export function useSurveyClients(surveyId: string) {
  const auth = useAuth()
  const isAdmin = auth.user?.metadata?.role === 'admin'

  return useQuery({
    queryKey: surveyClientKeys.clients(surveyId),
    queryFn: () => surveyClientsApi.getSurveyClients(surveyId),
    enabled: !!surveyId && isAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAddSurveyClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ surveyId, request }: { surveyId: string; request: AddSurveyClientRequest }) =>
      surveyClientsApi.addSurveyClient(surveyId, request),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.clients(surveyId) })
      toast.success('Survey client added successfully')
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to add survey client')
    }
  })
}

export function useUpdateSurveyClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      surveyId, 
      walletAddress, 
      request 
    }: { 
      surveyId: string
      walletAddress: string
      request: UpdateSurveyClientRequest 
    }) =>
      surveyClientsApi.updateSurveyClient(surveyId, walletAddress, request),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.clients(surveyId) })
      toast.success('Survey client updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to update survey client')
    }
  })
}

export function useRemoveSurveyClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ surveyId, walletAddress }: { surveyId: string; walletAddress: string }) =>
      surveyClientsApi.removeSurveyClient(surveyId, walletAddress),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.clients(surveyId) })
      toast.success('Survey client removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to remove survey client')
    }
  })
}

// Visibility management hooks
export function useSurveyVisibility(surveyId: string) {
  const auth = useAuth()
  const isAdmin = auth.user?.metadata?.role === 'admin'

  return useQuery({
    queryKey: surveyClientKeys.visibility(surveyId),
    queryFn: () => surveyClientsApi.getSurveyVisibility(surveyId),
    enabled: !!surveyId && isAdmin,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateSurveyVisibility() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ surveyId, request }: { surveyId: string; request: UpdateVisibilityRequest }) =>
      surveyClientsApi.updateSurveyVisibility(surveyId, request),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.visibility(surveyId) })
      toast.success('Survey visibility updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to update survey visibility')
    }
  })
}

export function useGenerateShareLink() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (surveyId: string) => surveyClientsApi.generateShareLink(surveyId),
    onSuccess: (data, surveyId) => {
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.visibility(surveyId) })
      toast.success('Share link generated successfully')
      
      // Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.shareUrl)
        toast.success('Share link copied to clipboard')
      }
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Failed to generate share link')
    }
  })
}

// Public hooks for viewing results
export function useSurveyResults(surveyId: string, token?: string) {
  return useQuery({
    queryKey: surveyClientKeys.results(surveyId, token),
    queryFn: () => surveyResultsApi.getSurveyResults(surveyId, token),
    enabled: !!surveyId,
    staleTime: 1 * 60 * 1000, // 1 minute - results can change
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSurveyResultsWithQuestions(surveyId: string, token?: string) {
  const resultsQuery = useSurveyResults(surveyId, token)
  const questionsQuery = useQuery({
    queryKey: surveyClientKeys.questions(surveyId),
    queryFn: async () => {
      const data = await surveyResultsApi.getSurveyQuestions(surveyId)
      // Ensure we always return an array
      return Array.isArray(data) ? data : []
    },
    enabled: !!surveyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  return {
    results: resultsQuery.data,
    questions: questionsQuery.data || [],
    isLoading: resultsQuery.isLoading || questionsQuery.isLoading,
    error: resultsQuery.error || questionsQuery.error,
    isError: resultsQuery.isError || questionsQuery.isError,
    refetch: () => {
      resultsQuery.refetch()
      questionsQuery.refetch()
    }
  }
}

export function useSurveyVisibilityInfo(surveyId: string) {
  return useQuery({
    queryKey: [...surveyClientKeys.visibility(surveyId), 'public'],
    queryFn: () => surveyResultsApi.getSurveyVisibilityInfo(surveyId),
    enabled: !!surveyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Utility hooks
export function useCanViewResults(surveyId: string, token?: string) {
  const auth = useAuth()
  const visibilityQuery = useSurveyVisibilityInfo(surveyId)
  
  const canView = React.useMemo(() => {
    if (!visibilityQuery.data) return false
    
    const { visibilityMode } = visibilityQuery.data
    
    // Public surveys can be viewed by anyone
    if (visibilityMode === 'public') return true
    
    // Token access
    if (token && visibilityMode === 'link') return true
    
    // Private surveys require authentication and client status
    if (visibilityMode === 'private') {
      return auth.user?.metadata?.role === 'admin' ||
             (auth.user?.walletAddress && surveyId) // Will be checked by backend
    }

    return false
  }, [visibilityQuery.data, token, auth.user, surveyId])
  
  return {
    canView,
    visibilityMode: visibilityQuery.data?.visibilityMode,
    isLoading: visibilityQuery.isLoading,
    error: visibilityQuery.error
  }
}

export function useInvalidateSurveyClients() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: surveyClientKeys.all }),
    invalidateClients: (surveyId: string) => 
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.clients(surveyId) }),
    invalidateVisibility: (surveyId: string) => 
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.visibility(surveyId) }),
    invalidateResults: (surveyId: string, token?: string) => 
      queryClient.invalidateQueries({ queryKey: surveyClientKeys.results(surveyId, token) }),
  }
}