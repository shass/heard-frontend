// Winners API endpoints (Prediction Surveys)

import { apiClient } from './client'
import type {
  WinnerStatus,
  WinnersPagedData,
  AddWinnersRequest
} from '@/lib/types'

export interface GetWinnersParams {
  limit?: number
  offset?: number
}

export class WinnersApi {
  /**
   * Check if current user is a winner for a survey
   * Requires authentication
   */
  async getWinnerStatus(surveyId: string): Promise<WinnerStatus> {
    const response = await apiClient.get<WinnerStatus>(`/surveys/${surveyId}/winner-status`)
    return response
  }

  /**
   * Get list of winners for a survey (Admin only)
   */
  async getWinners(surveyId: string, params: GetWinnersParams = {}): Promise<WinnersPagedData> {
    const queryParams = new URLSearchParams()

    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())

    const url = `/admin/surveys/${surveyId}/winners${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiClient.get<WinnersPagedData>(url)
    return response
  }

  /**
   * Add winners to a survey (Admin only)
   * Supports bulk addition via JSON
   */
  async addWinners(surveyId: string, request: AddWinnersRequest): Promise<{
    added: number
    failed: number
  }> {
    const response = await apiClient.post<{
      added: number
      failed: number
    }>(`/admin/surveys/${surveyId}/winners`, request)
    return response
  }

  /**
   * Remove a specific winner (Admin only)
   */
  async removeWinner(surveyId: string, winnerId: string): Promise<void> {
    await apiClient.delete(`/admin/surveys/${surveyId}/winners/${winnerId}`)
  }

  /**
   * Remove all winners for a survey (Admin only)
   */
  async removeAllWinners(surveyId: string): Promise<void> {
    await apiClient.delete(`/admin/surveys/${surveyId}/winners`)
  }
}

export const winnersApi = new WinnersApi()
