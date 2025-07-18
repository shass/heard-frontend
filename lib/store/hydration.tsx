'use client'

import { useEffect } from 'react'
import { useAuthStore, useUIStore } from './index'

export function StoreHydration() {
  useEffect(() => {
    // Manually hydrate stores on client side
    if (typeof window !== 'undefined') {
      useAuthStore.persist.rehydrate()
      useUIStore.persist.rehydrate()
    }
  }, [])

  return null
}