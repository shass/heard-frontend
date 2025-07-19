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
  async getSurveys(params: GetSurveysRequest = {}): Promise<GetSurveysResponse> {
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
    }>(url)

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
  async getSurvey(id: string): Promise<Survey> {
    const response = await apiClient.get<Survey>(`/surveys/${id}`)
    return response
  }

  /**
   * Check user eligibility for survey
   */
  async checkEligibility(id: string, params: {
    walletAddress?: string
  } = {}): Promise<EligibilityResponse> {
    const queryParams = new URLSearchParams()


    if (params.walletAddress) {
      queryParams.append('walletAddress', params.walletAddress)
    } else {
      // Don't make request without wallet address - this should not happen
      throw new Error('Wallet address is required for eligibility check')
    }

    const url = `/surveys/${id}/eligibility?${queryParams.toString()}`
    return await apiClient.get<EligibilityResponse>(url)
  }

  /**
   * Start survey and get first question
   */
  async startSurvey(id: string, request: StartSurveyRequest = {}): Promise<StartSurveyResponse> {
    return await apiClient.post<StartSurveyResponse>(`/surveys/${id}/start`, request)
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
}

// Export singleton instance
export const surveyApi = new SurveyApi()
export default surveyApi
