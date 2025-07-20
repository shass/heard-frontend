// Survey Response API endpoints

import { apiClient } from './client'
import type { 
  SurveyResponse, 
  Question,
  AnswerSubmissionRequest,
  RewardInfo
} from '@/lib/types'

export interface SubmitAnswerRequest {
  responseId: string
  questionId: string
  selectedAnswers: string[]
}

export interface SubmitAnswerResponse {
  nextQuestion?: Question
  progress: {
    currentQuestion: number
    totalQuestions: number
    percentComplete: number
  }
  canSubmit: boolean
}

export interface GetProgressResponse {
  currentQuestion: number
  totalQuestions: number
  percentComplete: number
  answeredQuestions: string[]
  canSubmit: boolean
}

export interface SubmitSurveyRequest {
  responseId: string
}

export interface SubmitSurveyResponse {
  completedAt: string
  herdPointsAwarded: number
  rewardInfo: RewardInfo
}

export class ResponseApi {
  /**
   * Submit answer to a specific question
   */
  async submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const { responseId, ...data } = request
    return await apiClient.post<SubmitAnswerResponse>(
      `/surveys/responses/${responseId}/answer`, 
      data
    )
  }

  /**
   * Get current progress of survey response
   */
  async getProgress(responseId: string): Promise<GetProgressResponse> {
    return await apiClient.get<GetProgressResponse>(`/surveys/responses/${responseId}/progress`)
  }

  /**
   * Submit completed survey for rewards
   */
  async submitSurvey(request: SubmitSurveyRequest): Promise<SubmitSurveyResponse> {
    const { responseId } = request
    console.log('Submitting survey with responseId:', responseId)
    console.log('Submit URL:', `/surveys/responses/${responseId}/submit`)
    return await apiClient.post<SubmitSurveyResponse>(
      `/surveys/responses/${responseId}/submit`,
      {}
    )
  }

  /**
   * Get survey response details
   * TODO: Implement backend endpoint for getting response details
   */
  async getResponse(responseId: string): Promise<SurveyResponse> {
    throw new Error('Response details endpoint not implemented on backend')
    // return await apiClient.get<SurveyResponse>(`/surveys/responses/${responseId}`)
  }

  /**
   * Check if user can continue survey response
   */
  async canContinue(responseId: string): Promise<{ canContinue: boolean; reason?: string }> {
    try {
      const progress = await this.getProgress(responseId)
      return { 
        canContinue: progress.percentComplete < 100 
      }
    } catch (error: any) {
      return { 
        canContinue: false, 
        reason: error.message || 'Survey response not found or expired'
      }
    }
  }

  /**
   * Get next unanswered question for response
   */
  async getNextQuestion(responseId: string): Promise<Question | null> {
    try {
      const progress = await this.getProgress(responseId)
      if (progress.canSubmit) {
        return null // Survey is complete
      }

      // This would typically be handled by the backend
      // For now, we'll rely on the submitAnswer response to provide next question
      throw new Error('Use submitAnswer to get next question')
    } catch (error) {
      throw new Error('Unable to get next question')
    }
  }

  /**
   * Auto-save answer (for draft functionality)
   */
  async autoSaveAnswer(request: SubmitAnswerRequest): Promise<{ saved: boolean }> {
    try {
      await this.submitAnswer(request)
      return { saved: true }
    } catch (error) {
      console.warn('Auto-save failed:', error)
      return { saved: false }
    }
  }

  /**
   * Validate answers before submission
   */
  validateAnswers(question: Question, selectedAnswers: string[]): { 
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check if required question has answers
    if (question.isRequired && selectedAnswers.length === 0) {
      errors.push('This question is required')
    }

    // Check answer count based on question type
    if (selectedAnswers.length > 0) {
      if (question.questionType === 'single' && selectedAnswers.length > 1) {
        errors.push('Only one answer allowed for this question')
      }

      // Validate that selected answers exist in question
      const validAnswerIds = question.answers.map(a => a.id)
      const invalidAnswers = selectedAnswers.filter(id => !validAnswerIds.includes(id))
      if (invalidAnswers.length > 0) {
        errors.push('Invalid answer selection')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const responseApi = new ResponseApi()
export default responseApi