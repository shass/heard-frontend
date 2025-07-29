// API functions for survey clients and results

import { apiClient } from '@/lib/api/client'

// Types for survey clients
export interface SurveyClient {
  id: string
  surveyId: string
  walletAddress: string
  canMakePublic: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface SurveyVisibilityInfo {
  visibilityMode: 'private' | 'public' | 'link'
  shareToken?: string
  shareUrl?: string
  visibilityChangedAt?: string
  visibilityChangedBy?: string
}

export interface SurveyResultsResponse {
  surveyId: string
  stats: {
    totalResponses: number
    completedResponses: number
    incompleteResponses: number
    averageCompletionTime?: number
  }
  responses: Array<{
    id: string
    walletAddress: string
    responses: Array<{
      questionId: string
      selectedAnswers: string[]
    }>
    completedAt?: string
    rewardIssued: boolean
    heardPointsAwarded: number
  }>
}

export interface QuestionWithAnswers {
  id: string
  surveyId: string
  questionText: string
  questionType: 'single' | 'multiple'
  order: number
  answers: Array<{
    id: string
    text: string
    order: number
  }>
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

// Requests
export interface AddSurveyClientRequest {
  walletAddress: string
  canMakePublic?: boolean
}

export interface UpdateSurveyClientRequest {
  canMakePublic: boolean
}

export interface UpdateVisibilityRequest {
  visibilityMode: 'private' | 'public' | 'link'
}

// Admin API functions
export const surveyClientsApi = {
  // Survey Clients Management
  async getSurveyClients(surveyId: string): Promise<SurveyClient[]> {
    return apiClient.get(`/admin/surveys/${surveyId}/clients`)
  },

  async addSurveyClient(surveyId: string, request: AddSurveyClientRequest): Promise<SurveyClient> {
    return apiClient.post(`/admin/surveys/${surveyId}/clients`, request)
  },

  async updateSurveyClient(
    surveyId: string,
    walletAddress: string,
    request: UpdateSurveyClientRequest
  ): Promise<SurveyClient> {
    return apiClient.put(`/admin/surveys/${surveyId}/clients/${walletAddress}`, request)
  },

  async removeSurveyClient(surveyId: string, walletAddress: string): Promise<void> {
    return apiClient.delete(`/admin/surveys/${surveyId}/clients/${walletAddress}`)
  },

  // Visibility Management
  async getSurveyVisibility(surveyId: string): Promise<SurveyVisibilityInfo> {
    return apiClient.get(`/admin/surveys/${surveyId}/visibility`)
  },

  async updateSurveyVisibility(
    surveyId: string,
    request: UpdateVisibilityRequest
  ): Promise<SurveyVisibilityInfo> {
    return apiClient.put(`/admin/surveys/${surveyId}/visibility`, request)
  },

  async generateShareLink(surveyId: string): Promise<{ shareUrl: string }> {
    return apiClient.post(`/admin/surveys/${surveyId}/share-link`)
  },
}

// Public API functions
export const surveyResultsApi = {
  // Survey Results Access
  async getSurveyResults(surveyId: string, token?: string): Promise<SurveyResultsResponse> {
    const params = token ? { token } : {}
    return apiClient.get(`/surveys/${surveyId}/results`, { params })
  },

  async getSurveyVisibilityInfo(surveyId: string): Promise<Omit<SurveyVisibilityInfo, 'shareToken'>> {
    return apiClient.get(`/surveys/${surveyId}/visibility`)
  },

  // Helper to get survey questions for results processing
  async getSurveyQuestions(surveyId: string): Promise<QuestionWithAnswers[]> {
    const response = await apiClient.get(`/surveys/${surveyId}/questions`)
    return response.questions || []
  },
}

// Helper functions for processing results data
export const resultsUtils = {
  // Process results into chart data for single-choice questions
  processSingleChoiceData(
    questionId: string,
    question: QuestionWithAnswers,
    responses: SurveyResultsResponse['responses']
  ) {
    const answerCounts = new Map<string, number>()

    // Initialize all answers with 0 count
    question.answers.forEach(answer => {
      answerCounts.set(answer.id, 0)
    })

    // Count responses
    responses.forEach(response => {
      const questionResponse = response.responses.find(r => r.questionId === questionId)
      if (questionResponse && questionResponse.selectedAnswers.length > 0) {
        const answerId = questionResponse.selectedAnswers[0]
        const currentCount = answerCounts.get(answerId) || 0
        answerCounts.set(answerId, currentCount + 1)
      }
    })

    // Convert to chart data
    return question.answers
      .sort((a, b) => a.order - b.order)
      .map(answer => ({
        id: answer.id,
        text: answer.text,
        count: answerCounts.get(answer.id) || 0,
        percentage: responses.length > 0 ?
          Math.round(((answerCounts.get(answer.id) || 0) / responses.length) * 100) : 0
      }))
  },

  // Process results into chart data for multiple-choice questions
  processMultipleChoiceData(
    questionId: string,
    question: QuestionWithAnswers,
    responses: SurveyResultsResponse['responses']
  ) {
    const answerCounts = new Map<string, number>()

    // Initialize all answers with 0 count
    question.answers.forEach(answer => {
      answerCounts.set(answer.id, 0)
    })

    // Count responses (can select multiple)
    responses.forEach(response => {
      const questionResponse = response.responses.find(r => r.questionId === questionId)
      if (questionResponse) {
        questionResponse.selectedAnswers.forEach(answerId => {
          const currentCount = answerCounts.get(answerId) || 0
          answerCounts.set(answerId, currentCount + 1)
        })
      }
    })

    // Convert to chart data
    return question.answers
      .sort((a, b) => a.order - b.order)
      .map(answer => ({
        id: answer.id,
        text: answer.text,
        count: answerCounts.get(answer.id) || 0,
        percentage: responses.length > 0 ?
          Math.round(((answerCounts.get(answer.id) || 0) / responses.length) * 100) : 0
      }))
  },

  // Generate color palette for charts
  generateChartColors(count: number): string[] {
    const baseColors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ]

    if (count <= baseColors.length) {
      return baseColors.slice(0, count)
    }

    // Generate additional colors if needed
    const colors = [...baseColors]
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360 // Golden angle for good color distribution
      colors.push(`hsl(${hue}, 70%, 50%)`)
    }

    return colors
  }
}
