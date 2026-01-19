/**
 * Survey Type Plugin Interface
 *
 * Defines the contract for survey type implementations.
 * Each survey type (Basic, NFT-Gated, Prediction Market, etc.) implements this interface.
 */

import { ComponentType } from 'react'
import { IAccessStrategy } from './IAccessStrategy'
import { IRewardStrategy } from './IRewardStrategy'
import {
  SurveyTypeConfig,
  AccessCheckResult,
  ValidationResult,
  QuestionRendererProps,
  ResultsRendererProps
} from './types'

// Import types from existing codebase
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'

// Survey and Question types (simplified - will use actual types from backend)
export interface Survey {
  id: string
  name: string
  company: string
  surveyType: string
  accessStrategyIds?: string[]
  accessCombineMode?: 'AND' | 'OR'
  [key: string]: any
}

export interface Question {
  id: string
  questionText: string
  questionType: string
  order: number
  answers: Answer[]
  isRequired: boolean
}

export interface Answer {
  id: string
  text: string
  order: number
}

export interface Response {
  questionId: string
  selectedAnswers: string[]
}

export interface ISurveyType {
  // ========================================
  // Identity
  // ========================================

  /** Unique survey type identifier (e.g., 'basic', 'nft-gated', 'prediction-market') */
  readonly id: string

  /** Human-readable survey type name */
  readonly name: string

  /** Description of what this survey type does */
  readonly description: string

  /** Icon/emoji for UI display */
  readonly icon: string

  // ========================================
  // Configuration
  // ========================================

  /**
   * Get survey type configuration
   * Defines rules, constraints, and requirements for this survey type
   */
  getConfig(): SurveyTypeConfig

  // ========================================
  // Access Control
  // ========================================

  /**
   * Get default access strategies for this survey type
   * These strategies are applied in addition to survey-specific strategies
   *
   * @returns array of access strategies
   */
  getAccessStrategies(): IAccessStrategy[]

  /**
   * Check if user has access to this survey
   * Combines survey-specific access strategies
   *
   * @param user - User attempting to access the survey
   * @param survey - Survey being accessed
   * @returns access check result
   */
  checkAccess(user: User, survey: Survey): Promise<AccessCheckResult>

  // ========================================
  // Reward Strategy
  // ========================================

  /**
   * Get reward strategy for this survey type
   * Defines how rewards are calculated and distributed
   */
  getRewardStrategy(): IRewardStrategy

  // ========================================
  // Validation
  // ========================================

  /**
   * Validate survey questions configuration
   * Called when creating/updating survey
   *
   * @param questions - Array of questions to validate
   * @returns validation result
   */
  validateQuestions(questions: Question[]): ValidationResult

  /**
   * Validate user responses
   * Called when submitting survey
   *
   * @param responses - Array of user responses to validate
   * @returns validation result
   */
  validateResponses(responses: Response[]): ValidationResult

  // ========================================
  // UI Components
  // ========================================

  /**
   * Get question renderer component
   * Used to display questions in survey UI
   */
  getQuestionRenderer(): ComponentType<QuestionRendererProps>

  /**
   * Get results renderer component
   * Used to display survey results/analytics
   */
  getResultsRenderer(): ComponentType<ResultsRendererProps>

  // ========================================
  // Lifecycle Hooks
  // ========================================

  /**
   * Called when survey is created
   * Use for initialization, blockchain interaction, etc.
   *
   * @param survey - Newly created survey
   */
  onSurveyCreate?(survey: Survey): Promise<void>

  /**
   * Called when user starts taking a survey
   * Use for analytics, tracking, state initialization, etc.
   *
   * @param user - User starting the survey
   * @param survey - Survey being started
   */
  onSurveyStart?(user: User, survey: Survey): Promise<void>

  /**
   * Called when user answers a question
   * Use for validation, analytics, real-time updates, etc.
   *
   * @param user - User answering the question
   * @param survey - Survey containing the question
   * @param question - Question being answered
   * @param answer - Selected answer(s)
   */
  onQuestionAnswer?(user: User, survey: Survey, question: Question, answer: string[]): Promise<void>

  /**
   * Called when user completes survey
   * Use for reward distribution, state updates, etc.
   *
   * @param user - User who completed the survey
   * @param survey - Completed survey
   * @param responses - All user responses
   */
  onSurveyComplete?(user: User, survey: Survey, responses: Response[]): Promise<void>

  /**
   * Called when rewards are distributed
   * Use for custom reward logic, notifications, etc.
   *
   * @param user - User receiving reward
   * @param amount - Reward amount
   */
  onRewardDistribute?(user: User, amount: number): Promise<void>
}
