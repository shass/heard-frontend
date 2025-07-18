'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Type, Moon, Sun, Zap } from 'lucide-react'

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-zinc-900 text-white px-4 py-2 rounded-md font-medium z-50
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
    >
      Skip to main content
    </a>
  )
}

// Accessibility settings panel
export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('accessibility-settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setHighContrast(settings.highContrast || false)
        setLargeText(settings.largeText || false)
        setReducedMotion(settings.reducedMotion || false)
      }
    } catch (error) {
      // Silently handle localStorage errors
    }

    // Check for system preference for reduced motion
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReducedMotion(mediaQuery.matches)
    } catch (error) {
      // Silently handle matchMedia errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Apply accessibility settings
    const root = document.documentElement
    
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    if (largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }
    
    if (reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Save settings
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify({
        highContrast,
        largeText,
        reducedMotion
      }))
    } catch (error) {
      // Silently handle localStorage errors
    }
  }, [highContrast, largeText, reducedMotion])

  return (
    <>
      {/* Accessibility trigger button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 z-40 bg-zinc-900 text-white hover:bg-zinc-800 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
        aria-label="Open accessibility settings"
      >
        <Eye className="w-4 h-4" />
      </Button>

      {/* Accessibility panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
            role="dialog"
            aria-labelledby="accessibility-title"
            aria-describedby="accessibility-description"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="accessibility-title" className="text-lg font-semibold text-zinc-900">
                Accessibility Settings
              </h2>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                aria-label="Close accessibility settings"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>

            <p id="accessibility-description" className="text-sm text-zinc-600 mb-6">
              Customize your experience with these accessibility options.
            </p>

            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-zinc-600" />
                  <label htmlFor="high-contrast" className="text-sm font-medium text-zinc-700">
                    High Contrast
                  </label>
                </div>
                <button
                  id="high-contrast"
                  onClick={() => setHighContrast(!highContrast)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                           focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2
                           ${highContrast ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                  role="switch"
                  aria-checked={highContrast}
                  aria-label="Toggle high contrast mode"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                             ${highContrast ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {/* Large Text */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Type className="w-4 h-4 text-zinc-600" />
                  <label htmlFor="large-text" className="text-sm font-medium text-zinc-700">
                    Large Text
                  </label>
                </div>
                <button
                  id="large-text"
                  onClick={() => setLargeText(!largeText)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                           focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2
                           ${largeText ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                  role="switch"
                  aria-checked={largeText}
                  aria-label="Toggle large text mode"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                             ${largeText ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-zinc-600" />
                  <label htmlFor="reduced-motion" className="text-sm font-medium text-zinc-700">
                    Reduced Motion
                  </label>
                </div>
                <button
                  id="reduced-motion"
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                           focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2
                           ${reducedMotion ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                  role="switch"
                  aria-checked={reducedMotion}
                  aria-label="Toggle reduced motion mode"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                             ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setIsOpen(false)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Handle Escape key to close modals
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]')
        const lastModal = modals[modals.length - 1]
        if (lastModal) {
          const closeButton = lastModal.querySelector('button[aria-label*="Close"]') as HTMLElement
          if (closeButton) {
            closeButton.click()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [])
}

// Live region for screen readers
export function LiveRegion({ 
  children, 
  level = 'polite' 
}: { 
  children: React.ReactNode
  level?: 'polite' | 'assertive' | 'off'
}) {
  return (
    <div 
      aria-live={level}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Focus trap for modals
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus()
            event.preventDefault()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus()
            event.preventDefault()
          }
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstFocusable?.focus()

    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])
}