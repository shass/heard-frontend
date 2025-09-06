'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlatformManager } from '@/lib/platform/platform.manager'

export function useNavigationFix() {
  const router = useRouter()

  const handleNavigationClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href]') as HTMLAnchorElement
    
    if (!link) return
    
    const href = link.getAttribute('href')
    if (!href) return
    
    // Only handle internal links
    if (href.startsWith('/') && !href.startsWith('//')) {
      const platform = PlatformManager.getInstance().detect()
      
      // Prevent default navigation for mini apps to avoid reload
      if (platform.type === 'base' || platform.type === 'farcaster') {
        event.preventDefault()
        
        console.log(`[Navigation] Intercepted click to ${href} on ${platform.type}`)
        router.push(href)
      }
    }
  }, [router])

  useEffect(() => {
    // Add click event listener to intercept navigation
    document.addEventListener('click', handleNavigationClick, true)
    
    return () => {
      document.removeEventListener('click', handleNavigationClick, true)
    }
  }, [handleNavigationClick])

  return {
    navigateWithoutReload: useCallback((href: string) => {
      const platform = PlatformManager.getInstance().detect()
      console.log(`[Navigation] Programmatic navigation to ${href} on ${platform.type}`)
      router.push(href)
    }, [router])
  }
}