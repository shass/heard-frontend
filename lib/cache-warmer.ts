// Cache warming utility for React Query
// Preloads critical data to prevent flickering and redirects on app startup

import { QueryClient } from '@tanstack/react-query'
import { surveyApi } from './api/surveys'
import { authApi } from './api/auth'

interface CacheWarmerConfig {
  // Enable/disable specific cache warming features
  surveys: boolean
  user: boolean
  // Add more as needed
}

const DEFAULT_CONFIG: CacheWarmerConfig = {
  surveys: true,
  user: true,
}

export class CacheWarmer {
  private queryClient: QueryClient
  private config: CacheWarmerConfig

  constructor(queryClient: QueryClient, config: Partial<CacheWarmerConfig> = {}) {
    this.queryClient = queryClient
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Warm cache with critical data that's likely to be needed immediately
   */
  async warmCache(): Promise<void> {
    console.log('🔥 Starting cache warming...')
    
    const promises: Promise<any>[] = []

    // Warm surveys cache
    if (this.config.surveys) {
      promises.push(this.warmSurveysCache())
    }

    // Warm user cache (if authenticated)
    if (this.config.user) {
      promises.push(this.warmUserCache())
    }

    try {
      await Promise.allSettled(promises)
      console.log('✅ Cache warming completed')
    } catch (error) {
      console.warn('⚠️ Cache warming had some failures:', error)
    }
  }

  /**
   * Pre-load surveys list - most commonly accessed data
   */
  private async warmSurveysCache(): Promise<void> {
    try {
      console.log('🔥 Warming surveys cache...')
      
      // Pre-load active surveys (most common request)
      await this.queryClient.prefetchQuery({
        queryKey: ['surveys', 'list', { status: 'active', limit: 20, offset: 0 }],
        queryFn: () => surveyApi.getSurveys({ status: 'active', limit: 20, offset: 0 }),
        staleTime: 2 * 60 * 1000, // 2 minutes - fresh data
      })

      // Pre-load all surveys for navigation
      await this.queryClient.prefetchQuery({
        queryKey: ['surveys', 'list', { limit: 50, offset: 0 }],
        queryFn: () => surveyApi.getSurveys({ limit: 50, offset: 0 }),
        staleTime: 2 * 60 * 1000, // 2 minutes - fresh data
      })

      console.log('✅ Surveys cache warmed')
    } catch (error) {
      console.warn('⚠️ Failed to warm surveys cache:', error)
    }
  }

  /**
   * Pre-load user data if there's a potential session
   */
  private async warmUserCache(): Promise<void> {
    try {
      console.log('🔥 Warming user cache...')
      
      // Try to pre-load user data (will use HttpOnly cookie if available)
      // This prevents the 401 flash when user is actually authenticated
      await this.queryClient.prefetchQuery({
        queryKey: ['auth', 'user'],
        queryFn: () => authApi.checkAuth(),
        staleTime: 30 * 1000, // 30 seconds - relatively fresh for auth data
        retry: false, // Don't retry auth failures during cache warming
      })

      console.log('✅ User cache warmed')
    } catch (error: any) {
      // Auth failures are expected when not logged in, don't spam console
      if (error?.status !== 401) {
        console.warn('⚠️ Failed to warm user cache:', error)
      }
    }
  }

  /**
   * Pre-load specific survey data (useful for survey pages)
   */
  async warmSurveyDetails(surveyId: string): Promise<void> {
    try {
      console.log(`🔥 Warming survey ${surveyId} cache...`)
      
      // Pre-load survey details
      await this.queryClient.prefetchQuery({
        queryKey: ['surveys', 'detail', surveyId],
        queryFn: () => surveyApi.getSurvey(surveyId),
        staleTime: 2 * 60 * 1000, // 2 minutes
      })

      // Pre-load survey questions
      await this.queryClient.prefetchQuery({
        queryKey: ['surveys', surveyId, 'questions'],
        queryFn: () => surveyApi.getQuestions(surveyId),
        staleTime: 2 * 60 * 1000, // 2 minutes
      })

      console.log(`✅ Survey ${surveyId} cache warmed`)
    } catch (error) {
      console.warn(`⚠️ Failed to warm survey ${surveyId} cache:`, error)
    }
  }

  /**
   * Clear all cached data (useful for logout)
   */
  clearCache(): void {
    console.log('🗑️ Clearing all cache...')
    this.queryClient.clear()
  }

  /**
   * Clear authentication-specific cache
   */
  clearAuthCache(): void {
    console.log('🗑️ Clearing auth cache...')
    this.queryClient.removeQueries({ queryKey: ['auth'] })
    this.queryClient.removeQueries({ queryKey: ['user'] })
  }
}

// Export a factory function to create cache warmer instances
export function createCacheWarmer(
  queryClient: QueryClient, 
  config?: Partial<CacheWarmerConfig>
): CacheWarmer {
  return new CacheWarmer(queryClient, config)
}

// Export individual warming functions for more granular control
export const cacheWarmers = {
  /**
   * Quick warm for homepage - surveys list
   */
  warmHomepage: async (queryClient: QueryClient) => {
    const warmer = createCacheWarmer(queryClient, { surveys: true, user: false })
    await warmer.warmCache()
  },

  /**
   * Warm for authenticated users - includes user data
   */
  warmAuthenticated: async (queryClient: QueryClient) => {
    const warmer = createCacheWarmer(queryClient, { surveys: true, user: true })
    await warmer.warmCache()
  },

  /**
   * Warm specific survey page
   */
  warmSurveyPage: async (queryClient: QueryClient, surveyId: string) => {
    const warmer = createCacheWarmer(queryClient)
    await Promise.all([
      warmer.warmCache(), // Basic data
      warmer.warmSurveyDetails(surveyId) // Survey-specific data
    ])
  },
}