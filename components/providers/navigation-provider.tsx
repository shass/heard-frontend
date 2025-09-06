'use client'

import React from 'react'
import { useNavigationFix } from '@/hooks/use-navigation-fix'

interface NavigationProviderProps {
  children: React.ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  useNavigationFix()
  
  return <>{children}</>
}