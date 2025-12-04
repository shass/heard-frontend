import { useMemo } from 'react'
import type { Survey } from '@/lib/types'
import { SurveyStrategyFactory } from '@/lib/survey/strategies'
import type { ISurveyStrategy } from '@/lib/survey/strategies'

/**
 * Hook to get the appropriate strategy for a survey
 * @param survey - The survey object
 * @returns The strategy instance for the survey type
 */
export function useSurveyStrategy(survey: Survey | undefined): ISurveyStrategy | null {
  return useMemo(() => {
    if (!survey) {
      return null
    }

    try {
      return SurveyStrategyFactory.getStrategy(survey.surveyType)
    } catch (error) {
      console.error(`Failed to get strategy for survey type: ${survey.surveyType}`, error)
      return null
    }
  }, [survey?.surveyType])
}
