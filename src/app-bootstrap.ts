/**
 * Application Bootstrap
 *
 * Registers all plugins at application startup.
 * Call this once in root layout or _app.
 */

import { platformRegistry } from '@/src/core/registry/PlatformRegistry'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store'
import { surveyTypeRegistry } from '@/src/core/registry/SurveyTypeRegistry'
import { accessStrategyRegistry } from '@/src/core/registry/AccessStrategyRegistry'

// Platform plugins
import { WebPlatformPlugin } from '@/src/platforms/web/WebPlatformPlugin'
import { BaseAppPlatformPlugin } from '@/src/platforms/base-app/BaseAppPlatformPlugin'
import { FarcasterPlatformPlugin } from '@/src/platforms/farcaster/FarcasterPlatformPlugin'

// Survey type plugins
import { BasicSurveyType } from '@/src/survey-types/basic'
import { PredictionMarketSurveyType } from '@/src/survey-types/prediction-market'

// Access strategy plugins
import { WhitelistAccessStrategy } from '@/src/access-strategies/whitelist'
import { BringIdAccessStrategy } from '@/src/access-strategies/bringid'

/**
 * Bootstrap platform system
 * Registers all platform plugins
 */
export function bootstrapPlatforms() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Bootstrap] Registering platform plugins...')
  }

  try {
    // Register platforms
    platformRegistry.register(new WebPlatformPlugin())
    platformRegistry.register(new BaseAppPlatformPlugin())
    platformRegistry.register(new FarcasterPlatformPlugin())

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Bootstrap] ✅ Registered ${platformRegistry.getAll().length} platforms`)
    }
  } catch (error) {
    console.error('[Bootstrap] ❌ Error registering platforms:', error)
    throw error
  }
}

/**
 * Bootstrap survey type system
 * Registers all survey type plugins
 */
export function bootstrapSurveyTypes() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Bootstrap] Registering survey type plugins...')
  }

  try {
    // Register survey types
    surveyTypeRegistry.register(new BasicSurveyType())
    surveyTypeRegistry.register(new PredictionMarketSurveyType())
    // NFT-gated and Quadratic Voting will be added later

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Bootstrap] ✅ Registered ${surveyTypeRegistry.getAll().length} survey types`)
    }
  } catch (error) {
    console.error('[Bootstrap] ❌ Error registering survey types:', error)
    throw error
  }
}

/**
 * Bootstrap access strategy system
 * Registers all access strategy plugins
 */
export function bootstrapAccessStrategies() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Bootstrap] Registering access strategy plugins...')
  }

  try {
    // Register access strategies
    accessStrategyRegistry.register(new WhitelistAccessStrategy())
    accessStrategyRegistry.register(new BringIdAccessStrategy())

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Bootstrap] ✅ Registered ${accessStrategyRegistry.getAll().length} access strategies`)
    }
  } catch (error) {
    console.error('[Bootstrap] ❌ Error registering access strategies:', error)
    throw error
  }
}

/**
 * Idempotency flag to prevent double bootstrap
 * Required for React StrictMode which calls useEffect twice in development
 */
let isBootstrapped = false

/**
 * Bootstrap entire application
 * Registers all plugins and initializes the system
 */
export async function bootstrapApplication() {
  // Guard against double initialization (React StrictMode in dev)
  if (isBootstrapped) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Bootstrap] ⚠️ Already bootstrapped, skipping duplicate call')
    }
    return
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('='.repeat(60))
    console.log('[Bootstrap] Starting HEARD Application Bootstrap')
    console.log('='.repeat(60))
  }

  const start = Date.now()
  isBootstrapped = true

  try {
    // Register all plugins
    bootstrapPlatforms()
    bootstrapSurveyTypes()
    bootstrapAccessStrategies()

    // Detect and activate platform
    if (process.env.NODE_ENV === 'development') {
      console.log('[Bootstrap] Detecting platform...')
    }

    try {
      await platformRegistry.detectAndActivate()
    } catch (detectionError) {
      console.error('[Bootstrap] Platform detection failed:', detectionError)

      // Fallback: Try to activate Web platform as default
      const webPlatform = platformRegistry.get('web')
      if (webPlatform) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Bootstrap] Falling back to Web platform...')
        }

        await webPlatform.onActivate?.()
        platformRegistry['activePlugin'] = webPlatform

        if (process.env.NODE_ENV === 'development') {
          console.log('[Bootstrap] ✅ Fallback to Web platform successful')
        }
      } else {
        throw new Error('Platform detection failed and no fallback available')
      }
    }

    // Wire up platform-specific token storage to ApiClient
    apiClient.setTokenStorage(platformRegistry.getActive().createTokenStorage())

    // Wire up synchronous 401 handler to avoid race condition with async logout
    apiClient.setOnUnauthorized(() => {
      const state = useAuthStore.getState()
      if (state.initialized) {
        state.logout()
      }
    })

    const duration = Date.now() - start

    if (process.env.NODE_ENV === 'development') {
      console.log('='.repeat(60))
      console.log(`[Bootstrap] ✅ Application ready in ${duration}ms`)
      console.log(`[Bootstrap] Active platform: ${platformRegistry.getActive().name}`)
      console.log(`[Bootstrap] Available survey types: ${surveyTypeRegistry.getAll().length}`)
      console.log(`[Bootstrap] Available access strategies: ${accessStrategyRegistry.getAll().length}`)
      console.log('='.repeat(60))
    }
  } catch (error) {
    console.error('[Bootstrap] ❌ Bootstrap failed:', error)
    throw error
  }
}

/**
 * Reset all registries (for testing)
 */
export function resetBootstrap() {
  platformRegistry.reset()
  surveyTypeRegistry.reset()
  accessStrategyRegistry.reset()
  isBootstrapped = false

  if (process.env.NODE_ENV === 'development') {
    console.log('[Bootstrap] ✅ All registries reset')
  }
}
