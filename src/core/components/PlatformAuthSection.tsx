'use client'

/**
 * Platform Auth Section
 *
 * Renders the authentication section for the active platform
 * Replaces the old AuthSectionSwitch
 */

import { usePlatform } from '@/src/core/hooks/usePlatform'

export function PlatformAuthSection() {
  const { platform, isLoading, error } = usePlatform()

  if (isLoading) {
    return (
      <div className="h-10 w-32 bg-zinc-100 rounded-lg animate-pulse"></div>
    )
  }

  if (error) {
    return (
      <div className="h-10 w-32 bg-red-100 rounded-lg flex items-center justify-center text-xs text-red-600">
        Error
      </div>
    )
  }

  if (!platform) {
    return null
  }

  // Get platform-specific AuthSection component
  const AuthSection = platform.getAuthSection()

  return <AuthSection />
}
