import type { Survey, SurveyType } from '@/lib/types'
import { SurveyStrategyFactory } from './strategies'

/**
 * Get formatted reward display for a survey using Strategy Pattern
 * @param survey - Survey object
 * @param context - Display context (list or detail view)
 * @returns Formatted reward string
 */
export function formatSurveyReward(
  survey: Survey,
  context?: 'list' | 'detail'
): string {
  const strategy = SurveyStrategyFactory.getStrategy(survey.surveyType)
  return strategy.getRewardDisplay(survey, context).formatted
}

/**
 * Get human-readable label for survey type
 * @param surveyType - Survey type enum value
 * @returns Type label (e.g., "Standard", "Prediction")
 */
export function getSurveyTypeLabel(surveyType: SurveyType): string {
  const strategy = SurveyStrategyFactory.getStrategy(surveyType)
  return strategy.getTypeLabel()
}
