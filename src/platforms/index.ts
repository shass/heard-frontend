// Platform system exports
export { Platform, platformToApiValue } from './config'
export type { PlatformConfig } from './config'

export { PlatformDetector } from './_core/detection/detector'
export type { MiniKitContext } from './_core/detection/detector'
export { PlatformDetectorProvider, usePlatformDetector } from './_core/PlatformDetectorProvider'

// Web platform specific exports
export { WebAuthProvider } from './web/providers/WebAuthProvider'
export { useBaseAppWallet } from './base-app/hooks/useBaseAppWallet'
export { useFarcasterWallet } from './farcaster/hooks/useFarcasterWallet'

// Base App platform specific exports
export { BaseAppAuthProvider } from './base-app/providers/BaseAppAuthProvider'

// Farcaster platform specific exports
export { FarcasterAuthProvider } from './farcaster/providers/FarcasterAuthProvider'

// Integration layer - unified hooks with Strategy pattern
export { useAuth } from './_core/hooks/useAuth'
export { useWallet } from './_core/hooks/useWallet'
export { useCompatibleAuth } from '../components/hooks/use-compatible-auth'
export { PlatformSwitch, useMigrationChoice } from './_core/components/PlatformSwitch'
export { AuthSectionSwitch } from './_core/components/AuthSectionSwitch'
export { PlatformLayoutSwitch } from './_core/components/PlatformLayoutSwitch'

// Strategy interfaces
export type { IAuthStrategy } from './_core/shared/interfaces/IAuthStrategy'
export type { IWalletStrategy } from './_core/shared/interfaces/IWalletStrategy'

// Shared interfaces
export type { IAuthProvider, AuthResult, Session, User } from './_core/shared/interfaces/IAuthProvider'
export { AuthState } from './_core/shared/interfaces/IAuthProvider'

// Shared types
export type { TransactionRequest, WalletConnection } from './_core/shared/types'