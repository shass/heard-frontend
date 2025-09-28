# Multi-Platform Architecture System

This directory contains the multi-platform architecture system that enables the application to work across different environments: Web browsers, Base App (MiniKit), Farcaster Frames, and Telegram WebApp.

## 🏗️ Architecture Overview

```
src/platforms/
├── config.ts                    # Platform enum and configuration types
├── registry.ts                  # Platform configuration registry
├── factory.ts                   # Platform provider factory
├── PlatformManager.ts           # Central platform management singleton
├── PlatformContext.tsx          # React context for platform state
├── detection/
│   └── detector.ts              # Platform detection logic
├── shared/
│   └── interfaces/              # Common interfaces for all platforms
│       ├── IPlatformProvider.ts # Core platform provider interface
│       ├── IAuthProvider.ts     # Authentication provider interface
│       └── IWalletProvider.ts   # Wallet provider interface
├── web/                         # Web platform implementation
│   ├── WebPlatformProvider.ts   # Web platform provider
│   ├── providers/               # Web-specific providers
│   ├── layouts/                 # Web-specific layouts
│   └── hooks/                   # Web-specific React hooks
├── base-app/                    # Base App (MiniKit) implementation
├── farcaster/                   # Farcaster Frames implementation
└── components/                  # Shared platform components
    └── PlatformDebugger.tsx     # Development debugging component
```

## 🚀 Quick Start

### 1. Basic Platform Detection

```tsx
import { usePlatform } from '@/src/platforms'

function MyComponent() {
  const { platform, platformInfo, isInitialized } = usePlatform()
  
  if (!isInitialized) return <div>Loading platform...</div>
  
  return (
    <div>
      <h1>Running on: {platformInfo.name}</h1>
      <p>Platform: {platform}</p>
      <p>Features: {platformInfo.features.join(', ')}</p>
    </div>
  )
}
```

### 2. Web Platform Authentication

```tsx
import { useWebAuth } from '@/src/platforms'

function AuthComponent() {
  const { 
    isAuthenticated, 
    user, 
    authenticate, 
    logout, 
    canAuthenticate 
  } = useWebAuth()
  
  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.id}</p>
        <button onClick={logout}>Sign Out</button>
      </div>
    )
  }
  
  return (
    <button 
      onClick={authenticate} 
      disabled={!canAuthenticate}
    >
      Sign In with Wallet
    </button>
  )
}
```

### 3. Web Platform Wallet Integration

```tsx
import { useWebWallet } from '@/src/platforms'

function WalletComponent() {
  const { 
    isConnected, 
    address, 
    balance, 
    connect, 
    disconnect,
    signMessage 
  } = useWebWallet()
  
  const handleSign = async () => {
    try {
      const signature = await signMessage('Hello, World!')
      console.log('Signed message:', signature)
    } catch (error) {
      console.error('Failed to sign message:', error)
    }
  }
  
  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>
  }
  
  return (
    <div>
      <p>Connected: {address}</p>
      <p>Balance: {balance} ETH</p>
      <button onClick={handleSign}>Sign Message</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}
```

## 🛠️ Platform Implementation Status

### ✅ Phase 1: Architecture Foundation (Complete)
- [x] Multi-platform directory structure
- [x] Platform detection system
- [x] Provider factory and interfaces
- [x] React Context integration
- [x] Basic platform providers

### ✅ Phase 2: Web Platform Implementation (Complete)
- [x] Web platform provider with Wagmi integration
- [x] Web authentication provider
- [x] Web wallet provider
- [x] Web-specific React hooks
- [x] Web platform layout
- [x] Enhanced debugging tools

### 🔄 Phase 3: Base App Integration (Pending Documentation)
- [ ] Review MiniKit documentation
- [ ] Implement Base App authentication flow
- [ ] Create Base App specific UI components
- [ ] Test in Base App environment

### 🔄 Phase 4: Farcaster Integration (Pending Documentation)
- [ ] Review Frames documentation
- [ ] Implement Frame-based UI
- [ ] Handle Frame actions
- [ ] Test in Farcaster clients

## 🔧 Available Platforms

### Web Browser (`web`)
**Status**: ✅ Fully Implemented

- **Features**: wallet, storage, notifications, sharing, geolocation, clipboard, offline, localStorage, sessionStorage, indexedDB
- **Auth**: JWT cookie-based authentication with wallet signature
- **Wallet**: RainbowKit + Wagmi integration
- **Capabilities**: Full Web3 functionality

### Base App (`base-app`)
**Status**: 🚧 Awaiting MiniKit Documentation

- **Features**: wallet, transactions, signing
- **Auth**: MiniKit-based authentication (pending implementation)
- **Wallet**: MiniKit wallet integration (pending implementation)

### Farcaster Frame (`farcaster`)
**Status**: 🚧 Awaiting Frames Documentation

- **Features**: actions, frames, limited-ui
- **Auth**: Frame-based authentication (pending implementation)
- **Wallet**: Limited transaction capabilities (pending implementation)

## 🧪 Testing

Visit `/platform-test` page to test the platform system:

1. **Platform Detection**: Automatically detects current environment
2. **Web Features**: Test wallet connection and authentication
3. **Browser Capabilities**: View detailed browser feature detection
4. **Provider Status**: Check initialization status of all providers

### Testing Different Platforms

Open browser console and run these commands to simulate other platforms:

```javascript
// Simulate Base App
window.MiniKit = {}; location.reload()

// Simulate Telegram WebApp
window.Telegram = { WebApp: {} }; location.reload()

// Reset to Web
delete window.MiniKit; delete window.Telegram; location.reload()
```

## 📚 API Reference

### Core Interfaces

#### `IPlatformProvider`
```typescript
interface IPlatformProvider {
  initialize(): Promise<void>
  shutdown(): Promise<void>
  getPlatformName(): string
  getPlatformVersion(): string
  isSupported(): boolean
  hasFeature(feature: string): boolean
  getFeatures(): string[]
}
```

#### `IAuthProvider`
```typescript
interface IAuthProvider {
  connect(): Promise<AuthResult>
  disconnect(): Promise<void>
  getSession(): Promise<Session | null>
  getCurrentUser(): Promise<User | null>
  getWalletAddress(): Promise<string | null>
  onAuthStateChange(callback: (state: AuthState) => void): () => void
}
```

#### `IWalletProvider`
```typescript
interface IWalletProvider {
  connect(): Promise<WalletConnection>
  disconnect(): Promise<void>
  isConnected(): boolean
  getAddress(): Promise<string | null>
  getBalance(): Promise<bigint | null>
  getChainId(): Promise<number | null>
  signMessage(message: string): Promise<string>
  sendTransaction(tx: TransactionRequest): Promise<string>
  onAccountChange(callback: (account: string | null) => void): () => void
  onChainChange(callback: (chainId: number) => void): () => void
}
```

### React Hooks

- `usePlatform()`: Access platform context and information
- `useWebAuth()`: Web platform authentication (Web only)
- `useWebWallet()`: Web platform wallet integration (Web only)

## 🔄 Migration from Legacy System

The new platform system is designed to work alongside the existing authentication system. To migrate:

1. **Current Web3 Usage**: Existing `useAuth` and `useAccount` can be gradually replaced with `useWebAuth` and `useWebWallet`
2. **Platform-Specific Features**: Use `usePlatform` to check current platform and conditionally render features
3. **Authentication Flow**: Platform-specific auth providers handle the complexities of each environment

## 📋 Development Guidelines

1. **Platform Detection**: Always check platform before using platform-specific features
2. **Feature Detection**: Use `hasFeature()` to check capabilities before using them
3. **Error Handling**: All providers include proper error handling and loading states
4. **TypeScript**: Fully typed interfaces for all platform interactions
5. **Testing**: Use the `PlatformDebugger` component for development and debugging

## 🛠️ Next Steps

1. **Complete Base App Integration**: Once MiniKit documentation is reviewed
2. **Complete Farcaster Integration**: Once Frames documentation is reviewed  
3. **Add Telegram WebApp Support**: Future platform addition
4. **Performance Optimization**: Bundle splitting for platform-specific code
5. **E2E Testing**: Platform-specific test suites

---

For detailed implementation guidance, see:
- [MIGRATION-PLAN.md](../../../../MIGRATION-PLAN.md)
- [BASE-APP-INTEGRATION.md](../../../../BASE-APP-INTEGRATION.md)
- [FARCASTER-INTEGRATION.md](../../../../FARCASTER-INTEGRATION.md)