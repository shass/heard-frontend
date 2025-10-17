import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useCallback, useRef, useState, useEffect } from 'react'
import { surveyApi } from '@/lib/api/surveys'

interface UseSearchSurveysOptions {
  enabled?: boolean
  throttleMs?: number
}

interface SearchParams {
  search?: string
  company?: string
  limit?: number
  offset?: number
}

export function useSearchSurveys(options: UseSearchSurveysOptions = {}) {
  const { enabled = true, throttleMs = 200 } = options
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check if there's an active search/filter
  const hasActiveSearch = Boolean(searchParams.search || searchParams.company)

  // React Query for actual API calls
  const queryResult = useQuery({
    queryKey: ['surveys', 'search', searchParams],
    queryFn: async ({ signal }) => {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()

      return surveyApi.getSurveys({
        ...searchParams,
        limit: searchParams.limit || 50,
        offset: searchParams.offset || 0
      }, { signal: signal || abortControllerRef.current.signal })
    },
    // Only enable when there's an actual search/filter
    enabled: enabled && hasActiveSearch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
    retry: (failureCount, error: any) => {
      // Don't retry if request was aborted
      if (error?.name === 'AbortError') return false
      return failureCount < 3
    },
    // Keep previous data while fetching new data
    placeholderData: keepPreviousData
  })

  // Throttled search function
  const updateSearch = useCallback((newParams: SearchParams) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for throttling
    timeoutRef.current = setTimeout(() => {
      setSearchParams(prev => ({
        ...prev,
        ...newParams,
        // Reset offset when search changes
        offset: newParams.search !== prev.search || newParams.company !== prev.company ? 0 : newParams.offset
      }))
    }, throttleMs)
  }, [throttleMs])

  // Immediate search function (no throttling)
  const searchNow = useCallback((newParams: SearchParams) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      offset: newParams.search !== prev.search || newParams.company !== prev.company ? 0 : newParams.offset
    }))
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setSearchParams({})
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    ...queryResult,
    currentParams: searchParams,
    updateSearch,
    searchNow,
    clearSearch,
    // Convenience getters
    hasActiveSearch,
    searchTerm: searchParams.search || '',
    selectedCompany: searchParams.company || ''
  }
}
