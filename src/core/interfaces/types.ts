/**
 * Shared types for the core plugin system
 */

import { ComponentType, ReactNode } from 'react'

/**
 * Platform configuration
 */
export interface PlatformConfig {
  tokenStorageType: 'localStorage' | 'sessionStorage' | 'none'
  authMethod: 'wallet' | 'quickAuth' | 'oauth' | 'telegram'
  supportedNetworks?: Network[]

  ui: {
    brandColor: string
    connectButtonText: string
    showNetworkSwitch: boolean
  }
}

export interface Network {
  chainId: number
  name: string
  rpcUrl?: string
}

/**
 * Platform features and capabilities
 */
export interface PlatformFeatures {
  wallet: boolean
  notifications: boolean
  sharing: boolean
  deepLinks: boolean
  storage?: 'localStorage' | 'sessionStorage' | 'none'
}

/**
 * Platform constraints and limitations
 */
export interface PlatformConstraints {
  maxFileSize: number
  allowedDomains: string[]
  requiredPermissions: string[]
}

/**
 * Survey type configuration
 */
export interface SurveyTypeConfig {
  allowAnonymous: boolean
  allowMultipleResponses: boolean
  requireWallet: boolean
  supportedQuestionTypes: QuestionType[]
  maxQuestions: number
  minResponses: number
  requiresTimeGating?: boolean
  requiresNftOwnership?: boolean
}

export type QuestionType = 'single' | 'multiple' | 'text' | 'rating' | 'ranking'

/**
 * Access check result
 */
export interface AccessCheckResult {
  allowed: boolean
  reason?: string
  requiresAction?: {
    type: 'oauth' | 'install-extension' | 'mint-nft' | 'hold-token' | 'follow'
    actionUrl?: string
    instructions: string
  }
}

/**
 * Access strategy configuration
 */
export interface AccessStrategyConfig {
  enabled: boolean
  priority: number // Higher = checked first
  combineMode: 'AND' | 'OR' // How to combine with other strategies
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Component props for renderers
 */
export interface QuestionRendererProps {
  survey: any // Will be replaced with proper Survey type
  question: any
  onAnswer: (answer: any) => void
}

export interface ResultsRendererProps {
  survey: any
  results: any
}

export interface ConfigUIProps {
  config: any
  onChange: (config: any) => void
}

export interface AccessInstructionsProps {
  survey: any
  user: any
  requiresAction: AccessCheckResult['requiresAction']
}

export interface LayoutProps {
  children: ReactNode
}
