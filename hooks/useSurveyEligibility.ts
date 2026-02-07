'use client'

import { useEffect, useState } from 'react'
import { useAccessControl } from '@/src/core/hooks/useAccessControl'
import { useAuthStore } from '@/lib/store'
import { getUserFriendlyMessage } from '@/src/core/utils/error-handling'
import type { Survey as LibSurvey } from '@/lib/types'
import type { Survey as CoreSurvey } from '@/src/core/interfaces/ISurveyType'

// Union type to accept both survey types (they share the same core fields)
type Survey = LibSurvey | CoreSurvey

interface UseSurveyEligibilityResult {
  isEligible: boolean | null
  isLoading: boolean
  reason: string | null
  error: Error | null
  retry: () => void
  accessStrategies: string[] | undefined
}

/**
 * Hook to check if current user has access to a survey
 * Handles authentication and access strategy checks with retry logic
 */
export function useSurveyEligibility(survey: Survey | null | undefined): UseSurveyEligibilityResult {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const authLoading = useAuthStore(state => state.loading)
  const { checkAccess, isChecking, result, error: accessError } = useAccessControl()
  const [hasChecked, setHasChecked] = useState(false)
  const [localError, setLocalError] = useState<Error | null>(null)
  const [retryTrigger, setRetryTrigger] = useState(0)

  useEffect(() => {
    // Reset when survey changes
    setHasChecked(false)
    setLocalError(null)
  }, [survey?.id])

  useEffect(() => {
    // Don't check until we have both user and survey, and haven't checked yet
    if (!survey || !user || !isAuthenticated || authLoading || hasChecked || isChecking) {
      return
    }

    const strategyIds = survey.accessStrategyIds || []

    // If no access strategies defined, allow access
    if (strategyIds.length === 0) {
      setHasChecked(true)
      setLocalError(null)
      return
    }

    // Check access with error handling
    checkAccess(user as any, survey, strategyIds)
      .then(() => {
        setHasChecked(true)
        setLocalError(null)
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err))

        if (process.env.NODE_ENV === 'development') {
          console.error('[useSurveyEligibility] Access check failed:', error)
        }

        setHasChecked(true)
        setLocalError(error)
      })
  }, [survey, user, isAuthenticated, authLoading, hasChecked, isChecking, checkAccess, retryTrigger])

  // Determine loading state
  const isLoading = authLoading || isChecking || (!hasChecked && isAuthenticated && !!survey)

  // Determine eligibility
  let isEligible: boolean | null = null
  let reason: string | null = null
  const error = localError || accessError

  if (!isAuthenticated) {
    isEligible = false
    reason = 'You must be authenticated to access this survey'
  } else if (error) {
    isEligible = false
    reason = getUserFriendlyMessage(error)
  } else if (hasChecked && result) {
    isEligible = result.allowed
    reason = result.reason || null
  } else if (!survey) {
    isEligible = false
    reason = 'Survey not found'
  } else if (hasChecked && !survey.accessStrategyIds?.length) {
    // No access strategies = open access
    isEligible = true
  }

  // Retry function
  const retry = () => {
    setHasChecked(false)
    setLocalError(null)
    setRetryTrigger(prev => prev + 1)
  }

  return {
    isEligible,
    isLoading,
    reason,
    error,
    retry,
    accessStrategies: survey?.accessStrategyIds
  }
}
