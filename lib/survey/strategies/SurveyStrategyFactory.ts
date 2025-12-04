import { SurveyType } from '@/lib/types'
import type { ISurveyStrategy } from './ISurveyStrategy'
import { StandardSurveyStrategy } from './StandardSurveyStrategy'
import { PredictionSurveyStrategy } from './PredictionSurveyStrategy'

/**
 * Factory for creating survey strategy instances
 * Implements singleton pattern for strategy instances
 */
export class SurveyStrategyFactory {
  private static strategies = new Map<SurveyType, ISurveyStrategy>([
    [SurveyType.STANDARD, new StandardSurveyStrategy()],
    [SurveyType.PREDICTION, new PredictionSurveyStrategy()],
  ])

  /**
   * Get strategy instance for a given survey type
   * @throws Error if survey type is not supported
   */
  static getStrategy(surveyType: SurveyType): ISurveyStrategy {
    const strategy = this.strategies.get(surveyType)

    if (!strategy) {
      throw new Error(`Unsupported survey type: ${surveyType}`)
    }

    return strategy
  }

  /**
   * Register a new strategy for a survey type
   * Useful for testing or extending with new survey types
   */
  static registerStrategy(surveyType: SurveyType, strategy: ISurveyStrategy): void {
    this.strategies.set(surveyType, strategy)
  }

  /**
   * Check if a survey type is supported
   */
  static isSupported(surveyType: SurveyType): boolean {
    return this.strategies.has(surveyType)
  }

  /**
   * Get all supported survey types
   */
  static getSupportedTypes(): SurveyType[] {
    return Array.from(this.strategies.keys())
  }
}
