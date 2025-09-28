# Base App Authentication - Safe Implementation Guide

## Overview

This implementation provides a robust, safe approach to using OnchainKit MiniKit hooks for Base App authentication. The key improvement is adding availability checks to prevent runtime errors when hooks are not available or when the app is not running in a MiniKit environment.

## Key Improvements

### 1. **Hook Availability Checks**
- **Problem**: Direct use of OnchainKit hooks without checking availability causes crashes when not in MiniKit environment
- **Solution**: Created `useSafeMiniKit` wrapper that safely checks for hook availability

### 2. **Safe Provider Pattern**
- **Problem**: Providers assumed hooks were always available
- **Solution**: Created `BaseAppAuthProviderSafe` that gracefully handles missing hooks

### 3. **Environment Detection**
- **Problem**: No reliable way to detect if running in Base App/MiniKit environment
- **Solution**: Multiple detection methods in `isInMiniKitEnvironment()` function

### 4. **Graceful Fallbacks**
- **Problem**: App would crash when hooks were unavailable
- **Solution**: Returns safe defaults and error states when hooks are missing

## File Structure

```
src/platforms/base-app/
├── hooks/
│   ├── useBaseAppAuth.ts          # Original implementation (legacy)
│   ├── useBaseAppAuthSafe.ts      # Safe implementation with checks
│   └── useSafeMiniKit.ts          # Safe wrapper for MiniKit hooks
├── providers/
│   ├── BaseAppAuthProvider.ts     # Original provider (legacy)
│   └── BaseAppAuthProviderSafe.ts # Safe provider with fallbacks
└── README.md                       # This file
```

## Usage

### Safe Hook Usage

```typescript
import { useBaseAppAuthSafe } from '@/src/platforms/base-app/hooks/useBaseAppAuthSafe'

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isHookAvailable,  // Check this before using MiniKit features
    authenticate,
    error
  } = useBaseAppAuthSafe()

  if (!isHookAvailable) {
    return <div>MiniKit not available in this environment</div>
  }

  // Safe to use MiniKit features
  return (
    <button onClick={authenticate}>
      Authenticate with Base App
    </button>
  )
}
```

### Environment Detection

```typescript
import { isInMiniKitEnvironment, getMiniKitEnvironmentInfo } from '@/src/platforms/base-app/hooks/useSafeMiniKit'

// Check if in MiniKit environment
if (isInMiniKitEnvironment()) {
  console.log('Running in Base App/MiniKit')
}

// Get detailed environment info for debugging
const info = getMiniKitEnvironmentInfo()
console.log('Environment info:', info)
```

## Migration Guide

### From Original to Safe Implementation

1. **Replace imports:**
```typescript
// Before
import { useBaseAppAuth } from './hooks/useBaseAppAuth'

// After
import { useBaseAppAuthSafe } from './hooks/useBaseAppAuthSafe'
```

2. **Check hook availability:**
```typescript
// Before
const { authenticate } = useBaseAppAuth()
authenticate() // Could crash if hooks unavailable

// After
const { authenticate, isHookAvailable } = useBaseAppAuthSafe()
if (isHookAvailable) {
  authenticate() // Safe to call
}
```

3. **Handle errors gracefully:**
```typescript
const { error, isHookAvailable } = useBaseAppAuthSafe()

if (!isHookAvailable) {
  // Show alternative auth method for non-MiniKit environments
  return <StandardWebAuth />
}

if (error) {
  // Handle specific MiniKit errors
  return <ErrorMessage>{error}</ErrorMessage>
}
```

## Security Considerations

1. **Context vs Authentication**
   - Context data (`miniKit.context.user`) is provided by the app but not cryptographically verified
   - Authentication (`authenticate.signIn()`) provides cryptographic proof of identity
   - Always prefer authenticated state over context-only data

2. **SIWE Integration**
   - The safe implementation maintains SIWE (Sign In With Ethereum) support
   - Nonce-based authentication prevents replay attacks
   - JWT tokens should be validated on the backend

3. **Environment Spoofing**
   - Multiple detection methods make spoofing harder
   - Server-side validation should never rely solely on client environment claims

## OnchainKit Version Compatibility

- **Current Version**: 0.38.19 ✅
- **Minimum Required**: 0.38.0
- **Features Used**:
  - `useMiniKit` hook
  - `useAuthenticate` hook
  - SIWE authentication
  - MiniKit context

## Common Issues and Solutions

### Issue: "Cannot read property 'useMiniKit' of undefined"
**Solution**: OnchainKit not installed or wrong import path. Check package.json and import statements.

### Issue: "Hooks can only be called inside function components"
**Solution**: Ensure hooks are only used in React function components, not in class components or regular functions.

### Issue: "MiniKit not available" error
**Solution**: This is expected when not in Base App environment. Use the safe implementation to handle this gracefully.

### Issue: Authentication fails silently
**Solution**: Check browser console for detailed error messages. Ensure backend SIWE endpoint is configured correctly.

## Future Improvements

1. **Dynamic Import**: Consider lazy-loading OnchainKit to reduce bundle size
2. **Cache Context**: Implement context caching to reduce re-renders
3. **Retry Logic**: Add automatic retry for failed authentication attempts
4. **Telemetry**: Add analytics to track authentication success rates

## Support

For issues or questions about Base App authentication:
1. Check the [OnchainKit documentation](https://onchainkit.xyz/docs)
2. Review the [Base App developer guide](https://docs.base.org/minikit)
3. File issues in the project repository
