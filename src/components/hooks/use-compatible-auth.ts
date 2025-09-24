'use client'

import { useAuthActions } from '@/components/providers/auth-provider'

export function useCompatibleAuth() {
  return useAuthActions()
}