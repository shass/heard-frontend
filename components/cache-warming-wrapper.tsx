// Wrapper component that handles cache warming for different page types

'use client'

import React, { useEffect, useState } from 'react'
import { useCacheWarmer } from '@/hooks/use-cache-warmer'
import { CacheWarmingLoading, SurveyLoading } from '@/components/ui/app-loading'

interface CacheWarmingWrapperProps {
  children: React.ReactNode
  // Strategy for cache warming
  strategy?: 'homepage' | 'authenticated' | 'survey-page'
  surveyId?: string
  // Show loading during cache warming
  showLoadingDuringWarm?: boolean
  // Minimum time to show loading (prevents flash)
  minLoadingTime?: number
}

export function CacheWarmingWrapper({ 
  children,
  strategy = 'homepage',
  surveyId,
  showLoadingDuringWarm = false, // Default to false now
  minLoadingTime = 0, // No minimum time needed
}: CacheWarmingWrapperProps) {
  const { warmHomepage, warmAuthenticated, warmSurveyPage } = useCacheWarmer()

  useEffect(() => {
    // Start cache warming in background immediately
    const warmCache = async () => {
      try {
        // Select warming strategy and warm in background
        switch (strategy) {
          case 'homepage':
            warmHomepage().catch(error => 
              console.warn('Background homepage cache warming failed:', error)
            )
            break
          case 'authenticated':
            warmAuthenticated().catch(error => 
              console.warn('Background authenticated cache warming failed:', error)
            )
            break
          case 'survey-page':
            if (surveyId) {
              warmSurveyPage(surveyId).catch(error => 
                console.warn('Background survey cache warming failed:', error)
              )
            } else {
              warmHomepage().catch(error => 
                console.warn('Background fallback cache warming failed:', error)
              )
            }
            break
          default:
            warmHomepage().catch(error => 
              console.warn('Background default cache warming failed:', error)
            )
        }
      } catch (error) {
        console.warn('Cache warming setup failed:', error)
      }
    }

    // Fire and forget - don't block rendering
    warmCache()
  }, [strategy, surveyId, warmHomepage, warmAuthenticated, warmSurveyPage])

  // Always render children immediately
  return <>{children}</>
}

// Specialized components for different page types
export function HomePageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CacheWarmingWrapper 
      strategy="homepage" 
      showLoadingDuringWarm={false}
    >
      {children}
    </CacheWarmingWrapper>
  )
}

export function AuthenticatedPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CacheWarmingWrapper 
      strategy="authenticated" 
      showLoadingDuringWarm={false}
    >
      {children}
    </CacheWarmingWrapper>
  )
}

export function SurveyPageWrapper({ 
  children, 
  surveyId 
}: { 
  children: React.ReactNode
  surveyId: string 
}) {
  return (
    <CacheWarmingWrapper 
      strategy="survey-page" 
      surveyId={surveyId}
      showLoadingDuringWarm={false}
    >
      {children}
    </CacheWarmingWrapper>
  )
}