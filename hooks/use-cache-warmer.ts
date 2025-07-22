// Hook for using cache warmer in components

'use client'

import React, { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createCacheWarmer, cacheWarmers } from '@/lib/cache-warmer'

/**
 * Hook to access cache warming functionality
 */
export function useCacheWarmer() {
  const queryClient = useQueryClient()
  const cacheWarmerRef = useRef(createCacheWarmer(queryClient))

  const warmHomepage = useCallback(() => {
    return cacheWarmers.warmHomepage(queryClient)
  }, [queryClient])

  const warmAuthenticated = useCallback(() => {
    return cacheWarmers.warmAuthenticated(queryClient)
  }, [queryClient])

  const warmSurveyPage = useCallback((surveyId: string) => {
    return cacheWarmers.warmSurveyPage(queryClient, surveyId)
  }, [queryClient])

  const warmSurveyDetails = useCallback((surveyId: string) => {
    return cacheWarmerRef.current.warmSurveyDetails(surveyId)
  }, [])

  const clearCache = useCallback(() => {
    cacheWarmerRef.current.clearCache()
  }, [])

  const clearAuthCache = useCallback(() => {
    cacheWarmerRef.current.clearAuthCache()
  }, [])

  return {
    // Quick warming functions
    warmHomepage,
    warmAuthenticated,
    warmSurveyPage,
    warmSurveyDetails,
    
    // Cache management
    clearCache,
    clearAuthCache,
    
    // Direct access to cache warmer instance
    cacheWarmer: cacheWarmerRef.current,
  }
}

/**
 * Hook to warm cache when component mounts (useful for page components)
 */
export function useWarmCacheOnMount(
  warmFn: () => Promise<void>,
  dependencies: any[] = []
) {
  const hasWarmedRef = useRef(false)

  React.useEffect(() => {
    if (hasWarmedRef.current) return

    const warm = async () => {
      try {
        await warmFn()
        hasWarmedRef.current = true
      } catch (error) {
        console.warn('Cache warming on mount failed:', error)
      }
    }

    warm()
  }, dependencies)

  // Reset warmed flag if dependencies change
  React.useEffect(() => {
    hasWarmedRef.current = false
  }, dependencies)
}