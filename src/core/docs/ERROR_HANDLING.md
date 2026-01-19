# Error Handling Strategy

## Overview

This document describes the comprehensive error handling strategy implemented throughout the HEARD registry system.

## Error Handling Utilities

### Location
`/src/core/utils/error-handling.ts`

### Key Functions

#### `withRetry<T>(fn, options)`
Retries async operations with exponential backoff.

**Options:**
- `maxAttempts` (default: 3) - Maximum retry attempts
- `baseDelay` (default: 1000ms) - Base delay between retries
- `maxDelay` (default: 10000ms) - Maximum delay cap
- `onRetry` - Callback on each retry attempt

**Example:**
```typescript
const data = await withRetry(
  () => fetchData(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error.message)
    }
  }
)
```

#### `withTimeout<T>(promise, options)`
Adds timeout to async operations.

**Options:**
- `timeoutMs` (default: 5000ms) - Timeout duration
- `timeoutMessage` - Custom timeout error message

**Example:**
```typescript
const result = await withTimeout(
  apiCall(),
  { timeoutMs: 5000 }
)
```

#### `isOffline()`
Checks if browser is offline.

```typescript
if (isOffline()) {
  // Handle offline state
}
```

#### `getUserFriendlyMessage(error)`
Converts technical errors to user-friendly messages.

```typescript
const message = getUserFriendlyMessage(error)
// "Unable to connect. Please check your internet connection and try again."
```

#### `gracefullyDegrade<T>(operation, degradedValue, options)`
Attempts operation with fallback to degraded value.

**Example:**
```typescript
const features = await gracefullyDegrade(
  () => fetchFeatures(),
  { basic: true }, // fallback
  {
    retryOptions: { maxAttempts: 2 },
    timeoutMs: 3000
  }
)
```

## Error Boundaries

### Location
`/src/core/components/ErrorBoundary.tsx`

### Components

#### `ErrorBoundary`
Generic error boundary for catching React errors.

```tsx
<ErrorBoundary
  context="Survey Loading"
  fallback={(error, reset) => (
    <div>
      <p>{getUserFriendlyMessage(error)}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <SurveyContent />
</ErrorBoundary>
```

#### `PlatformErrorBoundary`
Specialized for platform detection errors.

```tsx
<PlatformErrorBoundary>
  <App />
</PlatformErrorBoundary>
```

#### `SurveyErrorBoundary`
Specialized for survey loading errors.

```tsx
<SurveyErrorBoundary>
  <Survey />
</SurveyErrorBoundary>
```

#### `AccessControlErrorBoundary`
Specialized for access control errors.

```tsx
<AccessControlErrorBoundary>
  <ProtectedContent />
</AccessControlErrorBoundary>
```

## Implementation by Component

### 1. AppBootstrap

**Features:**
- Retry logic (3 attempts with exponential backoff)
- Offline detection
- User-friendly error messages
- Fallback UI with reload option

**Error Handling:**
```typescript
// Retry bootstrap with backoff
await withRetry(
  () => bootstrapApplication(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt) => setRetryCount(attempt)
  }
)
```

### 2. Platform Detection

**Features:**
- Per-plugin timeout (3 seconds)
- Fallback to Web platform
- Safe deactivation on errors
- Detailed error logging

**Error Handling:**
```typescript
// Timeout for each plugin detection
const detected = await Promise.race([
  plugin.detect(),
  timeoutPromise
])

// Fallback to Web platform if all fail
if (detectionFailed) {
  const webPlatform = platformRegistry.get('web')
  await webPlatform.onActivate?.()
}
```

### 3. Access Control

**Features:**
- Strategy-level timeout (5 seconds)
- Validation of inputs
- Graceful degradation on missing strategies
- User-friendly error messages

**Error Handling:**
```typescript
// Timeout for each strategy
const result = await Promise.race([
  strategy.checkAccess(user, survey),
  timeoutPromise
])

// Graceful degradation
if (!strategies.length) {
  return { allowed: true } // Allow if no valid strategies
}
```

### 4. Whitelist Strategy

**Features:**
- API retry (3 attempts)
- Timeout (5 seconds)
- Fallback to local whitelist array
- Network error detection

**Error Handling:**
```typescript
// Retry with timeout
const eligibility = await withRetry(
  () => withTimeout(
    surveyApi.checkEligibility(survey.id, { walletAddress }),
    { timeoutMs: 5000 }
  ),
  { maxAttempts: 3, baseDelay: 500 }
)

// Fallback to local whitelist
if (apiCallFailed && survey.whitelist) {
  return checkLocalWhitelist()
}
```

### 5. Survey API

**Features:**
- Input validation
- Enhanced error messages
- Network error detection
- Timeout error handling

**Error Handling:**
```typescript
try {
  return await apiClient.get(`/surveys/${id}`)
} catch (error) {
  if (error.message.includes('404')) {
    throw new Error('Survey not found')
  }
  if (error.message.includes('timeout')) {
    throw new Error('Unable to load survey. The request took too long.')
  }
  throw error
}
```

### 6. useSurveyEligibility Hook

**Features:**
- Retry function
- Error state management
- User-friendly error messages
- Loading state handling

**Error Handling:**
```typescript
const { isEligible, isLoading, reason, error, retry } = useSurveyEligibility(survey)

// Retry on error
if (error) {
  return (
    <div>
      <p>{reason}</p>
      <button onClick={retry}>Try Again</button>
    </div>
  )
}
```

## User-Friendly Error Messages

### Network Errors
- ❌ "Network request failed"
- ✅ "Unable to connect. Please check your internet connection and try again."

### Timeout Errors
- ❌ "Request timeout"
- ✅ "The operation is taking too long. Please try again."

### Access Check Errors
- ❌ "Access check failed"
- ✅ "We couldn't verify your access. Please try again in a moment."

### Platform Detection Errors
- ❌ "No platform detected"
- ✅ "Unable to detect platform. Please reload the page."

### Whitelist Errors
- ❌ "API call failed"
- ✅ "We couldn't verify your whitelist status. Please check your connection and try again."

## Retry Configuration

### Default Settings
```typescript
{
  maxAttempts: 3,
  baseDelay: 1000,     // 1 second
  maxDelay: 10000      // 10 seconds
}
```

### Exponential Backoff
- Attempt 1: 1000ms delay
- Attempt 2: 2000ms delay
- Attempt 3: 4000ms delay

### Timeout Settings
- Platform detection: 3000ms per plugin
- Access strategy: 5000ms per strategy
- API calls: 5000ms (uses client timeout)

## Graceful Degradation

### Platform Detection
If detection fails, fallback to Web platform.

### Access Control
If strategies fail, allow access after retries (configurable).

### Whitelist Check
If API fails, check local whitelist array.

## Development Mode

### Enhanced Logging
All error handlers include detailed logging in development:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('[Context] Error details:', error)
}
```

### Debug Information
AppBootstrap shows debug details in development:

```tsx
<details>
  <summary>Debug Information</summary>
  <pre>{error.stack}</pre>
</details>
```

## Testing Error Handling

### Simulating Offline
```typescript
// Temporarily override navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: false,
  writable: true
})
```

### Simulating Timeout
```typescript
// Add artificial delay
await new Promise(resolve => setTimeout(resolve, 10000))
```

### Simulating Network Error
```typescript
// Throw network error
throw new Error('Failed to fetch')
```

## Best Practices

1. **Always use try/catch** around async operations
2. **Provide fallback values** for non-critical operations
3. **Use user-friendly messages** in production
4. **Log detailed errors** in development only
5. **Implement retry logic** for network operations
6. **Set appropriate timeouts** to prevent hanging
7. **Validate inputs** before operations
8. **Handle offline state** gracefully
9. **Use error boundaries** for React components
10. **Test error scenarios** during development

## Error Handling Checklist

- [ ] Try/catch around async operations
- [ ] Retry logic for network calls
- [ ] Timeout for long operations
- [ ] Input validation
- [ ] User-friendly error messages
- [ ] Fallback/degraded behavior
- [ ] Error boundaries for UI
- [ ] Development logging
- [ ] Offline detection
- [ ] Error recovery (retry buttons)
