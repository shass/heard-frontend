// Survey API endpoints

import { apiClient } from './client'
import type {
  Survey,
  Question,
  EligibilityResponse,
  PaginationMeta
} from '@/lib/types'

export interface GetSurveysRequest {
  limit?: number
  offset?: number
  company?: string
  status?: 'active' | 'inactive'
  search?: string
}

export interface GetSurveysResponse {
  surveys: Survey[]
  total: number
  meta: {
    pagination: PaginationMeta
  }
}

export interface StartSurveyRequest {
  linkDropCode?: string
}

export interface StartSurveyResponse {
  responseId: string
  firstQuestionId: string
}

export class SurveyApi {
  /**
   * Get list of active surveys with pagination
   */
  async getSurveys(params: GetSurveysRequest = {}, options?: { signal?: AbortSignal }): Promise<GetSurveysResponse> {
    const queryParams = new URLSearchParams()

    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.company) queryParams.append('company', params.company)
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)

    const url = `/surveys${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiClient.get<{
      items: Survey[],
      pagination: {
        total: number,
        limit: number,
        offset: number,
        hasMore: boolean
      }
    }>(url, { signal: options?.signal })

    // Transform backend response to frontend expected format
    return {
      surveys: response.items,
      total: response.pagination.total,
      meta: {
        pagination: {
          total: response.pagination.total,
          limit: response.pagination.limit,
          offset: response.pagination.offset,
          hasMore: response.pagination.hasMore
        }
      }
    }
  }

  /**
   * Get survey details by ID
   */
  async getSurvey(id: string, options?: { signal?: AbortSignal }): Promise<Survey> {
    if (!id) {
      throw new Error('Survey ID is required')
    }

    try {
      const response = await apiClient.get<Survey>(`/surveys/${id}`, { signal: options?.signal })
      return response
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SurveyApi] Failed to get survey:', error)
      }

      // Enhance error message
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error('Survey not found')
        }
        if (error.message.includes('timeout')) {
          throw new Error('Unable to load survey. The request took too long.')
        }
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error('Unable to load survey. Please check your internet connection.')
        }
      }

      throw error
    }
  }

  /**
   * Check user eligibility for survey
   */
  async checkEligibility(id: string, params: {
    walletAddress?: string
  } = {}, options?: { signal?: AbortSignal }): Promise<EligibilityResponse> {
    if (!id) {
      throw new Error('Survey ID is required')
    }

    if (!params.walletAddress) {
      throw new Error('Wallet address is required for eligibility check')
    }

    const queryParams = new URLSearchParams()
    queryParams.append('walletAddress', params.walletAddress)

    const url = `/surveys/${id}/eligibility?${queryParams.toString()}`

    try {
      return await apiClient.get<EligibilityResponse>(url, { signal: options?.signal })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SurveyApi] Eligibility check failed:', error)
      }

      // Enhance error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Eligibility check timed out. Please try again.')
        }
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error('Unable to check eligibility. Please check your internet connection.')
        }
      }

      throw error
    }
  }

  /**
   * Start survey and get first question
   */
  async startSurvey(id: string, request: StartSurveyRequest = {}): Promise<StartSurveyResponse> {
    const response = await apiClient.post<StartSurveyResponse>(`/surveys/${id}/start`, request)

    // Call lifecycle hook after survey start
    try {
      const [survey, { surveyTypeRegistry }, { useAuthStore }] = await Promise.all([
        this.getSurvey(id),
        import('@/src/core/registry/SurveyTypeRegistry'),
        import('@/lib/store')
      ])

      const { user } = useAuthStore.getState()
      if (user) {
        // Ensure user has platform field for lifecycle hooks
        const userWithPlatform = { ...user, platform: user.platform || 'web' }
        const surveyType = surveyTypeRegistry.get(survey.surveyType)
        await surveyType.onSurveyStart?.(userWithPlatform as any, survey)
      }
    } catch (error) {
      console.error('Survey type lifecycle hook failed:', error)
      // Don't block the main flow
    }

    return response
  }

  /**
   * Get survey questions (for authenticated and eligible users)
   */
  async getQuestions(id: string): Promise<{ questions: Question[] }> {
    return await apiClient.get<{ questions: Question[] }>(`/surveys/${id}/questions`)
  }

  /**
   * Get active surveys for public display (no auth required)
   */
  async getActiveSurveys(params: {
    limit?: number
    offset?: number
    company?: string
  } = {}): Promise<Survey[]> {
    const response = await this.getSurveys({
      ...params,
      status: 'active'
    })
    return response.surveys
  }

  /**
   * Search surveys by name or company
   */
  async searchSurveys(query: string, params: GetSurveysRequest = {}): Promise<Survey[]> {
    const response = await this.getSurveys({
      ...params,
      search: query,
      status: 'active'
    })
    return response.surveys
  }

  /**
   * Get surveys by company
   */
  async getSurveysByCompany(company: string, params: GetSurveysRequest = {}): Promise<Survey[]> {
    const response = await this.getSurveys({
      ...params,
      company,
      status: 'active'
    })
    return response.surveys
  }

  /**
   * Get user's survey progress (for incomplete surveys)
   */
  async getUserSurveyProgress(id: string): Promise<{
    hasIncompleteResponse: boolean
    hasCompletedResponse?: boolean
    progress?: {
      responseId: string
      currentQuestionOrder: number
      answeredQuestions: number
      totalQuestions: number
      nextQuestionId?: string
      responses?: Array<{
        questionId: string
        selectedAnswers: string[]
      }>
    }
  }> {
    return await apiClient.get<{
      hasIncompleteResponse: boolean
      hasCompletedResponse?: boolean
      progress?: {
        responseId: string
        currentQuestionOrder: number
        answeredQuestions: number
        totalQuestions: number
        nextQuestionId?: string
        responses?: Array<{
          questionId: string
          selectedAnswers: string[]
        }>
      }
    }>(`/surveys/${id}/my-progress`)
  }
}

// Export singleton instance
export const surveyApi = new SurveyApi()
export default surveyApi
