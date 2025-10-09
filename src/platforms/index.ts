// Platform system exports
export { Platform } from './config'
export type { PlatformConfig } from './config'

export { PlatformDetector } from './detection/detector'
export type { MiniKitContext } from './detection/detector'
export { PlatformFactory } from './factory'
export { PlatformManager } from './PlatformManager'
export { PlatformProvider, usePlatform } from './PlatformContext'
export { PlatformRegistry } from './registry'

// Platform providers
export { WebPlatformProvider } from './web/WebPlatformProvider'
export { BaseAppPlatformProvider } from './base-app/BaseAppPlatformProvider'
export { FarcasterPlatformProvider } from './farcaster/FarcasterPlatformProvider'

// Web platform specific exports
export { WebAuthProvider } from './web/providers/WebAuthProvider'
export { WebWalletProvider } from './web/providers/WebWalletProvider'
export { WebLayout } from './web/layouts/WebLayout'
export { useWebAuth } from './web/hooks/useWebAuth'
export { useWebWallet } from './web/hooks/useWebWallet'

// Base App platform specific exports
export { BaseAppAuthProvider } from './base-app/providers/BaseAppAuthProvider'
export { BaseAppWalletProvider } from './base-app/providers/BaseAppWalletProvider'
export { default as BaseAppLayout } from './base-app/layouts/BaseAppLayout'
export { useBaseAppAuth } from './base-app/hooks/useBaseAppAuth'
export { useBaseAppWallet } from './base-app/hooks/useBaseAppWallet'

// Farcaster platform specific exports
export { FarcasterAuthProvider } from './farcaster/providers/FarcasterAuthProvider'
export { FarcasterWalletProvider } from './farcaster/providers/FarcasterWalletProvider'
export { default as FarcasterLayout, FarcasterQuickAuthButton, FarcasterWalletButton, FarcasterProfileCard } from './farcaster/layouts/FarcasterLayout'
export { useFarcasterAuth } from './farcaster/hooks/useFarcasterAuth'
export { useFarcasterWallet } from './farcaster/hooks/useFarcasterWallet'

// Integration layer (only what remains)
export { useAuthAdapter } from '../components/hooks/use-auth-adapter'
export { useCompatibleAuth } from '../components/hooks/use-compatible-auth'
export { useCompatibleWallet } from '../components/hooks/use-compatible-wallet'
export { PlatformAwareLayout, withPlatformLayout } from './components/PlatformAwareLayout'
export { PlatformSwitch, useMigrationChoice } from '../components/PlatformSwitch'

// Components
export { PlatformDebugger } from './components/PlatformDebugger'


// Shared interfaces
export type { IPlatformProvider } from './shared/interfaces/IPlatformProvider'
export type { IAuthProvider, AuthResult, Session, User } from './shared/interfaces/IAuthProvider'
export { AuthState } from './shared/interfaces/IAuthProvider'
export type { IWalletProvider, WalletConnection, TransactionRequest } from './shared/interfaces/IWalletProvider'