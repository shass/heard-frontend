'use client'

import React from 'react'

interface MiniKitContextProviderProps {
  children: React.ReactNode
}

/**
 * MiniKit provider wrapper for @farcaster/miniapp-sdk
 *
 * Note: @farcaster/miniapp-sdk uses a singleton pattern (sdk export),
 * so no provider context is needed. This component exists for backwards
 * compatibility and can be removed if all code is refactored.
 */
export function MiniKitContextProvider({ children }: MiniKitContextProviderProps) {
  return <>{children}</>
}
