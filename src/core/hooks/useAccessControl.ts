'use client'

import { useCallback, useState } from 'react'
import { accessStrategyRegistry } from '@/src/core/registry/AccessStrategyRegistry'
import { AccessCheckResult } from '@/src/core/interfaces/types'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { Survey } from '@/src/core/interfaces/ISurveyType'

interface UseAccessControlOptions {
  onSuccess?: (result: AccessCheckResult) => void
  onError?: (error: Error) => void
}

interface UseAccessControlState {
  isChecking: boolean
  result: AccessCheckResult | null
  error: Error | null
}

/**
 * Check survey access using accessStrategyRegistry
 * Combines multiple strategies according to survey's access configuration
 *
 * @param options - Callback options
 * @returns access checking functions and state
 */
export function useAccessControl(options?: UseAccessControlOptions) {
  const [state, setState] = useState<UseAccessControlState>({
    isChecking: false,
    result: null,
    error: null,
  })

  /**
   * Check access for a user and survey
   */
  const checkAccess = useCallback(
    async (user: User, survey: Survey, strategyIds: string[]) => {
      try {
        setState({ isChecking: true, result: null, error: null })

        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[useAccessControl] Checking access for user:',
            user.id,
            'survey:',
            survey.id,
            'strategies:',
            strategyIds
          )
        }

        const result = await accessStrategyRegistry.checkAccess(user, survey, strategyIds)

        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[useAccessControl] Access check result:',
            result.allowed ? '✅ allowed' : '❌ denied',
            result.reason || ''
          )
        }

        setState({ isChecking: false, result, error: null })
        options?.onSuccess?.(result)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Access check failed')

        if (process.env.NODE_ENV === 'development') {
          console.error('[useAccessControl] Error checking access:', error.message)
        }

        setState({ isChecking: false, result: null, error })
        options?.onError?.(error)

        throw error
      }
    },
    [options]
  )

  /**
   * Reset access control state
   */
  const reset = useCallback(() => {
    setState({ isChecking: false, result: null, error: null })

    if (process.env.NODE_ENV === 'development') {
      console.log('[useAccessControl] State reset')
    }
  }, [])

  return {
    ...state,
    checkAccess,
    reset,
  }
}

/**
 * Simplified hook for checking if user has access
 * Returns early from component if access is denied
 *
 * @param user - User to check
 * @param survey - Survey to check access for
 * @param strategyIds - Strategy IDs to use
 * @returns access allowed state and loading state
 */
export function useCanAccess(user: User, survey: Survey, strategyIds: string[]) {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const check = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await accessStrategyRegistry.checkAccess(user, survey, strategyIds)

      setAllowed(result.allowed)

      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[useCanAccess] Result:',
          result.allowed ? '✅ allowed' : '❌ denied',
          result.reason || ''
        )
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Access check failed')
      setError(error)
      setAllowed(false)

      if (process.env.NODE_ENV === 'development') {
        console.error('[useCanAccess] Error:', error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, survey, strategyIds])

  return {
    allowed,
    isLoading,
    error,
    check,
  }
}
