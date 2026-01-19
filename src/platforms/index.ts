// Platform system exports - NEW REGISTRY-BASED ARCHITECTURE

// Legacy platform config (for backward compatibility)
export { Platform, platformToApiValue } from './config'
export type { PlatformConfig } from './config'

// Web platform specific exports (still needed for some components)
export { WebAuthProvider } from './web/providers/WebAuthProvider'

// NEW: Core hooks using plugin system
export { useAuth } from './_core/hooks/useAuth'
export { useWallet } from './_core/hooks/useWallet'

// Strategy interfaces
export type { IAuthStrategy } from './_core/shared/interfaces/IAuthStrategy'
export type { IWalletStrategy } from './_core/shared/interfaces/IWalletStrategy'

// Shared interfaces
export type { IAuthProvider, AuthResult, Session, User } from './_core/shared/interfaces/IAuthProvider'
export { AuthState } from './_core/shared/interfaces/IAuthProvider'

// Shared types
export type { TransactionRequest, WalletConnection } from './_core/shared/types'
