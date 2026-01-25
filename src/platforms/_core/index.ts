// Platform Provider (re-export from core)
export { usePlatform, PlatformProvider } from '@/src/core/hooks/usePlatform'
export { platformState } from '@/lib/platform/platformState'

// Hooks
export * from './hooks/useAuth'
export * from './hooks/useWallet'
export * from './hooks/useOpenUrl'
export * from './hooks/useShare'

// Shared Interfaces
export * from './shared/interfaces/IAuthProvider'
export * from './shared/interfaces/IAuthStrategy'
export * from './shared/interfaces/IWalletStrategy'
export * from './shared/interfaces/IUrlStrategy'
export * from './shared/interfaces/IShareStrategy'
