// Platform system exports
export { Platform, platformToApiValue } from './config'
export type { PlatformConfig } from './config'

export { PlatformDetector } from './_core/detection/detector'
export type { MiniKitContext } from './_core/detection/detector'
export { PlatformDetectorProvider, usePlatformDetector } from './_core/PlatformDetectorProvider'

// Web platform specific exports
export { WebAuthProvider } from './web/providers/WebAuthProvider'

// Note: BaseAppAuthProvider, FarcasterAuthProvider, useBaseAppWallet, useFarcasterWallet
// are deprecated - they use old @coinbase/onchainkit/minikit SDK
// Use useAuth() and useWallet() instead with new @farcaster/miniapp-sdk

// Integration layer - unified hooks with Strategy pattern
export { useAuth } from './_core/hooks/useAuth'
export { useWallet } from './_core/hooks/useWallet'
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