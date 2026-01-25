/**
 * Basic Survey Type Plugin
 *
 * Standard survey implementation with HeardPoints rewards.
 * Supports single and multiple choice questions with whitelist access control.
 */

import { ComponentType } from 'react'
import {
  ISurveyType,
  Survey,
  Question,
  Response
} from '@/src/core/interfaces/ISurveyType'
import { IAccessStrategy } from '@/src/core/interfaces/IAccessStrategy'
import { IRewardStrategy } from '@/src/core/interfaces/IRewardStrategy'
import {
  SurveyTypeConfig,
  AccessCheckResult,
  ValidationResult,
  QuestionRendererProps,
  ResultsRendererProps
} from '@/src/core/interfaces/types'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { accessStrategyRegistry } from '@/src/core/registry/AccessStrategyRegistry'
import { HeardPointsRewardStrategy } from './HeardPointsRewardStrategy'
import { BasicQuestionRenderer } from './components/BasicQuestionRenderer'

// Placeholder for results renderer until implemented
const PlaceholderResultsRenderer: ComponentType<ResultsRendererProps> = () => null

export class BasicSurveyType implements ISurveyType {
  readonly id = 'basic'
  readonly name = 'Basic Survey'
  readonly description = 'Standard survey with HeardPoints rewards'
  readonly icon = '📝'

  private rewardStrategy: IRewardStrategy

  constructor() {
    this.rewardStrategy = new HeardPointsRewardStrategy()
  }

  /**
   * Get survey type configuration
   */
  getConfig(): SurveyTypeConfig {
    return {
      allowAnonymous: false,
      allowMultipleResponses: false,
      requireWallet: true,
      supportedQuestionTypes: ['single', 'multiple'],
      maxQuestions: 50,
      minResponses: 1
    }
  }

  /**
   * Get default access strategies
   * Basic surveys use whitelist access control by default
   */
  getAccessStrategies(): IAccessStrategy[] {
    try {
      const whitelistStrategy = accessStrategyRegistry.get('whitelist')
      return [whitelistStrategy]
    } catch (error) {
      console.error('[BasicSurveyType] Whitelist strategy not registered:', error)
      return []
    }
  }

  /**
   * Check if user has access to survey
   * Delegates to access strategy registry
   */
  async checkAccess(user: User, survey: Survey): Promise<AccessCheckResult> {
    if (!survey.accessStrategyIds || survey.accessStrategyIds.length === 0) {
      // No access strategies configured - allow access
      return { allowed: true }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[BasicSurveyType] Checking access for user ${user.id} to survey ${survey.id}`,
        `with strategies: ${survey.accessStrategyIds.join(', ')}`
      )
    }

    return accessStrategyRegistry.checkAccess(user, survey, survey.accessStrategyIds)
  }

  /**
   * Get reward strategy
   */
  getRewardStrategy(): IRewardStrategy {
    return this.rewardStrategy
  }

  /**
   * Validate survey questions
   * Checks max question limit and question types
   */
  validateQuestions(questions: Question[]): ValidationResult {
    const errors: string[] = []
    const config = this.getConfig()

    // Check max questions limit
    if (questions.length > config.maxQuestions) {
      errors.push(`Survey cannot have more than ${config.maxQuestions} questions`)
    }

    // Check min questions
    if (questions.length === 0) {
      errors.push('Survey must have at least one question')
    }

    // Validate question types
    for (const question of questions) {
      if (!config.supportedQuestionTypes.includes(question.questionType as any)) {
        errors.push(
          `Question "${question.questionText}" has unsupported type: ${question.questionType}`
        )
      }

      // Validate answers exist
      if (!question.answers || question.answers.length === 0) {
        errors.push(`Question "${question.questionText}" must have at least one answer`)
      }
    }

    if (process.env.NODE_ENV === 'development' && errors.length > 0) {
      console.log('[BasicSurveyType] Question validation errors:', errors)
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate user responses
   * Checks that all required questions are answered
   */
  validateResponses(responses: Response[]): ValidationResult {
    const errors: string[] = []

    if (!responses || responses.length === 0) {
      errors.push('No responses provided')
      return { valid: false, errors }
    }

    // Check each response has at least one selected answer
    for (const response of responses) {
      if (!response.selectedAnswers || response.selectedAnswers.length === 0) {
        errors.push(`Question ${response.questionId} has no answer selected`)
      }
    }

    if (process.env.NODE_ENV === 'development' && errors.length > 0) {
      console.log('[BasicSurveyType] Response validation errors:', errors)
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Get question renderer component
   * Returns BasicQuestionRenderer for standard questions
   */
  getQuestionRenderer(): ComponentType<QuestionRendererProps> {
    return BasicQuestionRenderer
  }

  /**
   * Get results renderer component
   * Returns existing results component or placeholder
   */
  getResultsRenderer(): ComponentType<ResultsRendererProps> {
    // TODO: Import and return actual results component
    // For now, return placeholder
    if (process.env.NODE_ENV === 'development') {
      console.log('[BasicSurveyType] Using placeholder results renderer')
    }
    return PlaceholderResultsRenderer
  }

  /**
   * Called when survey is created
   * Optional lifecycle hook for initialization
   */
  async onSurveyCreate(survey: Survey): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BasicSurveyType] Survey created: ${survey.id}`)
    }
  }

  /**
   * Called when user starts taking a survey
   */
  async onSurveyStart(user: User, survey: Survey): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BasicSurveyType] User ${user.id} started survey ${survey.id}`)
    }
  }

  /**
   * Called when user answers a question
   */
  async onQuestionAnswer(user: User, survey: Survey, question: Question, answer: string[]): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BasicSurveyType] User ${user.id} answered question ${question.id} in survey ${survey.id}`)
    }
  }

  /**
   * Called when user completes survey
   * Distributes HeardPoints reward
   */
  async onSurveyComplete(user: User, survey: Survey, responses: Response[]): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BasicSurveyType] User ${user.id} completed survey ${survey.id}`)
    }

    // Distribute reward
    const result = await this.rewardStrategy.distribute(user, survey)

    if (!result.success) {
      console.error('[BasicSurveyType] Failed to distribute reward:', result.error)
      throw new Error(result.error || 'Failed to distribute reward')
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[BasicSurveyType] ✅ Distributed ${result.amountDistributed} points to user ${user.id}`
      )
    }
  }

  /**
   * Called when rewards are distributed
   * Optional lifecycle hook for notifications
   */
  async onRewardDistribute(user: User, amount: number): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BasicSurveyType] Reward distributed: ${amount} points to user ${user.id}`)
    }
  }
}
