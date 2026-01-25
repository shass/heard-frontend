/**
 * Prediction Market Survey Type
 *
 * Time-gated survey with pool-based rewards for correct predictions.
 * Users predict outcomes, and correct predictors split the reward pool.
 */

import { ComponentType } from 'react'
import {
  ISurveyType,
  Survey,
  Question,
  Response,
} from '@/src/core/interfaces/ISurveyType'
import {
  SurveyTypeConfig,
  AccessCheckResult,
  ValidationResult,
  QuestionRendererProps,
  ResultsRendererProps,
} from '@/src/core/interfaces/types'
import { IAccessStrategy } from '@/src/core/interfaces/IAccessStrategy'
import { IRewardStrategy } from '@/src/core/interfaces/IRewardStrategy'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { PredictionMarketRewardStrategy } from './PredictionMarketRewardStrategy'
import { PredictionMarketQuestionRenderer } from './components/PredictionMarketQuestionRenderer'

const MAX_QUESTIONS = 10
const MIN_RESPONSES = 10
const PlaceholderResultsRenderer: ComponentType<ResultsRendererProps> = () => null

export class PredictionMarketSurveyType implements ISurveyType {
  readonly id = 'prediction-market'
  readonly name = 'Prediction Market'
  readonly description = 'Time-gated survey with pool-based rewards for correct predictions'
  readonly icon = '🔮'

  private rewardStrategy: IRewardStrategy

  constructor() {
    this.rewardStrategy = new PredictionMarketRewardStrategy()
  }

  // ========================================
  // Configuration
  // ========================================

  getConfig(): SurveyTypeConfig {
    return {
      allowAnonymous: false,
      allowMultipleResponses: false,
      requireWallet: true,
      supportedQuestionTypes: ['single'], // Only single-choice questions
      maxQuestions: MAX_QUESTIONS,
      minResponses: MIN_RESPONSES,
      requiresTimeGating: true,
    }
  }

  // ========================================
  // Access Control
  // ========================================

  getAccessStrategies(): IAccessStrategy[] {
    // Prediction markets require wallet connection
    // Additional strategies (NFT ownership, token holding) can be added per survey
    return []
  }

  async checkAccess(user: User, survey: Survey): Promise<AccessCheckResult> {
    console.log('[PredictionMarketSurveyType] checkAccess', {
      userId: user.id,
      surveyId: survey.id,
      walletAddress: user.walletAddress,
    })

    // Check wallet connection
    if (!user.walletAddress) {
      return {
        allowed: false,
        reason: 'Wallet connection required for prediction markets',
        requiresAction: {
          type: 'hold-token',
          instructions: 'Please connect your wallet to participate in prediction markets',
        },
      }
    }

    // Check if survey is within time window
    const now = new Date()
    const startDate = survey.startDate ? new Date(survey.startDate) : null
    const endDate = survey.endDate ? new Date(survey.endDate) : null

    if (startDate && now < startDate) {
      return {
        allowed: false,
        reason: 'Survey has not started yet',
      }
    }

    if (endDate && now > endDate) {
      return {
        allowed: false,
        reason: 'Survey has ended',
      }
    }

    // Check if user already responded (no multiple responses allowed)
    // TODO: Query backend to check if user already submitted response
    // For now, assume user hasn't responded

    return {
      allowed: true,
    }
  }

  // ========================================
  // Reward Strategy
  // ========================================

  getRewardStrategy(): IRewardStrategy {
    return this.rewardStrategy
  }

  // ========================================
  // Validation
  // ========================================

  validateQuestions(questions: Question[]): ValidationResult {
    console.log('[PredictionMarketSurveyType] validateQuestions', {
      questionsCount: questions.length,
    })

    const errors: string[] = []

    // Check max questions
    if (questions.length > MAX_QUESTIONS) {
      errors.push(`Prediction markets support maximum ${MAX_QUESTIONS} questions (got ${questions.length})`)
    }

    // Check question types
    const invalidQuestions = questions.filter(q => q.questionType !== 'single')
    if (invalidQuestions.length > 0) {
      errors.push(
        `Prediction markets only support single-choice questions. Invalid questions: ${invalidQuestions.map(q => q.id).join(', ')}`
      )
    }

    // Check each question has at least 2 answers
    const questionsWithFewAnswers = questions.filter(q => q.answers.length < 2)
    if (questionsWithFewAnswers.length > 0) {
      errors.push(
        `Questions must have at least 2 answer options. Invalid questions: ${questionsWithFewAnswers.map(q => q.id).join(', ')}`
      )
    }

    // Check required questions
    const notRequiredQuestions = questions.filter(q => !q.isRequired)
    if (notRequiredQuestions.length > 0) {
      console.warn('[PredictionMarketSurveyType] All questions should be required for prediction markets')
    }

    const valid = errors.length === 0

    if (!valid) {
      console.error('[PredictionMarketSurveyType] Validation failed', { errors })
    }

    return {
      valid,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  validateResponses(responses: Response[]): ValidationResult {
    console.log('[PredictionMarketSurveyType] validateResponses', {
      responsesCount: responses.length,
    })

    const errors: string[] = []

    // Check each response has exactly one answer (single-choice)
    responses.forEach((response, index) => {
      if (response.selectedAnswers.length !== 1) {
        errors.push(
          `Response ${index + 1} (question ${response.questionId}) must have exactly 1 selected answer (got ${response.selectedAnswers.length})`
        )
      }
    })

    // TODO: Check if response is within time window
    // This requires survey context which isn't passed to this method
    // Consider adding survey parameter to validateResponses

    const valid = errors.length === 0

    if (!valid) {
      console.error('[PredictionMarketSurveyType] Response validation failed', { errors })
    }

    return {
      valid,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  // ========================================
  // UI Components
  // ========================================

  getQuestionRenderer(): ComponentType<QuestionRendererProps> {
    return PredictionMarketQuestionRenderer
  }

  getResultsRenderer(): ComponentType<ResultsRendererProps> {
    return PlaceholderResultsRenderer
  }

  // ========================================
  // Lifecycle Hooks
  // ========================================

  async onSurveyCreate(survey: Survey): Promise<void> {
    console.log('[PredictionMarketSurveyType] onSurveyCreate', {
      surveyId: survey.id,
      surveyName: survey.name,
    })

    // TODO: Initialize prediction market on blockchain (if needed)
    // TODO: Set up automated market resolution at endDate
  }

  async onSurveyStart(user: User, survey: Survey): Promise<void> {
    console.log('[PredictionMarketSurveyType] onSurveyStart', {
      surveyId: survey.id,
      userId: user.id,
      walletAddress: user.walletAddress,
    })

    // Track prediction market participation
  }

  async onQuestionAnswer(user: User, survey: Survey, question: Question, answer: string[]): Promise<void> {
    console.log('[PredictionMarketSurveyType] onQuestionAnswer', {
      surveyId: survey.id,
      userId: user.id,
      questionId: question.id,
      answer,
    })

    // Track predictions in real-time
  }

  async onSurveyComplete(user: User, survey: Survey, responses: Response[]): Promise<void> {
    console.log('[PredictionMarketSurveyType] onSurveyComplete', {
      surveyId: survey.id,
      userId: user.id,
      walletAddress: user.walletAddress,
    })

    // Check if survey has ended and market should be resolved
    const now = new Date()
    const endDate = survey.endDate ? new Date(survey.endDate) : null

    if (!endDate) {
      console.warn('[PredictionMarketSurveyType] Survey has no end date')
      return
    }

    if (now >= endDate) {
      console.log('[PredictionMarketSurveyType] Survey ended, resolving market...')
      await this.resolveMarket(survey)
    } else {
      console.log('[PredictionMarketSurveyType] Survey still active, market will be resolved at', endDate)
    }
  }

  async onRewardDistribute(user: User, amount: number): Promise<void> {
    console.log('[PredictionMarketSurveyType] onRewardDistribute', {
      userId: user.id,
      walletAddress: user.walletAddress,
      amount,
    })

    // TODO: Send notification to user about reward
    // TODO: Update user's HeardPoints balance
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Resolve prediction market and distribute rewards to winners
   */
  private async resolveMarket(survey: Survey): Promise<void> {
    console.log('[PredictionMarketSurveyType] resolveMarket', {
      surveyId: survey.id,
    })

    try {
      // TODO: Fetch all responses from backend
      // TODO: Determine correct answers (admin-defined or based on actual outcomes)
      // TODO: Identify winners (users who predicted correctly)
      // TODO: Calculate total pool
      // TODO: Distribute rewards using PredictionMarketRewardStrategy

      // Placeholder implementation
      const totalPool = (survey as any).totalPool || 0
      const winners: User[] = [] // TODO: Fetch winners from backend

      if (winners.length > 0) {
        const results = await this.rewardStrategy.distributeToWinners!(winners, totalPool)

        const successCount = results.filter(r => r.success).length
        console.log('[PredictionMarketSurveyType] Market resolved', {
          surveyId: survey.id,
          winnersCount: winners.length,
          successfulDistributions: successCount,
          totalPool,
        })
      } else {
        console.warn('[PredictionMarketSurveyType] No winners found, pool not distributed')
      }
    } catch (error) {
      console.error('[PredictionMarketSurveyType] Market resolution failed', {
        surveyId: survey.id,
        error,
      })
      throw error
    }
  }
}
