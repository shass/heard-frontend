'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePlatform } from '@/src/platforms'
import { Platform } from '@/src/platforms/config'

export function useNavigationFix() {
  const router = useRouter()
  const { platform } = usePlatform()

  const handleNavigationClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href]') as HTMLAnchorElement

    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    // Only handle internal links
    if (href.startsWith('/') && !href.startsWith('//')) {
      // Prevent default navigation for mini apps to avoid reload
      if (platform === Platform.BASE_APP || platform === Platform.FARCASTER) {
        event.preventDefault()
        
        console.log(`[Navigation] Intercepted click to ${href} on ${platform}`)
        router.push(href)
      }
    }
  }, [router, platform])

  useEffect(() => {
    // Add click event listener to intercept navigation
    document.addEventListener('click', handleNavigationClick, true)
    
    return () => {
      document.removeEventListener('click', handleNavigationClick, true)
    }
  }, [handleNavigationClick])

  return {
    navigateWithoutReload: useCallback((href: string) => {
      console.log(`[Navigation] Programmatic navigation to ${href} on ${platform}`)
      router.push(href)
    }, [router, platform])
  }
}