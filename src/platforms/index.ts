// Platform system exports
export { Platform, platformToApiValue } from './config'
export type { PlatformConfig } from './config'

export { PlatformDetector } from './_core/detection/detector'
export type { MiniKitContext } from './_core/detection/detector'
export { PlatformDetectorProvider, usePlatformDetector } from './_core/PlatformDetectorProvider'

// Web platform specific exports
export { WebAuthProvider } from './web/providers/WebAuthProvider'
export { useWebAuth } from './web/hooks/useWebAuth'
export { useWebWallet } from './web/hooks/useWebWallet'

// Base App platform specific exports
export { BaseAppAuthProvider } from './base-app/providers/BaseAppAuthProvider'
export { useBaseAppAuth } from './base-app/hooks/useBaseAppAuth'
export { useBaseAppWallet } from './base-app/hooks/useBaseAppWallet'

// Farcaster platform specific exports
export { FarcasterAuthProvider } from './farcaster/providers/FarcasterAuthProvider'
export { useFarcasterAuth } from './farcaster/hooks/useFarcasterAuth'
export { useFarcasterWallet } from './farcaster/hooks/useFarcasterWallet'

// Integration layer (only what remains)
export { useAuthAdapter } from '../components/hooks/use-auth-adapter'
export { useCompatibleAuth } from '../components/hooks/use-compatible-auth'
export { useCompatibleWallet } from '../components/hooks/use-compatible-wallet'
export { PlatformSwitch, useMigrationChoice } from '../components/PlatformSwitch'

// Shared interfaces
export type { IAuthProvider, AuthResult, Session, User } from './_core/shared/interfaces/IAuthProvider'
export { AuthState } from './_core/shared/interfaces/IAuthProvider'

// Shared types
export type { TransactionRequest, WalletConnection } from './_core/shared/types'