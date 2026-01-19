/**
 * Access Strategy Registry
 *
 * Singleton registry for managing access control strategies.
 * Handles registration, access checking, and combining multiple strategies.
 */

import { IAccessStrategy } from '../interfaces/IAccessStrategy'
import { AccessCheckResult } from '../interfaces/types'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { Survey } from '../interfaces/ISurveyType'

export class AccessStrategyRegistry {
  private static instance: AccessStrategyRegistry
  private strategies = new Map<string, IAccessStrategy>()

  /**
   * Get singleton instance
   */
  static getInstance(): AccessStrategyRegistry {
    if (!this.instance) {
      this.instance = new AccessStrategyRegistry()
    }
    return this.instance
  }

  /**
   * Register an access strategy
   *
   * @param strategy - Access strategy to register
   * @throws if strategy with same ID already registered
   */
  register(strategy: IAccessStrategy): void {
    if (this.strategies.has(strategy.id)) {
      throw new Error(`[AccessStrategyRegistry] Strategy "${strategy.id}" already registered`)
    }

    this.strategies.set(strategy.id, strategy)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AccessStrategyRegistry] Registered: ${strategy.name} (${strategy.id})`)
    }
  }

  /**
   * Unregister an access strategy
   *
   * @param id - Strategy ID to unregister
   */
  unregister(id: string): void {
    this.strategies.delete(id)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AccessStrategyRegistry] Unregistered: ${id}`)
    }
  }

  /**
   * Get a strategy by ID
   *
   * @param id - Strategy ID
   * @returns access strategy
   * @throws if strategy not found
   */
  get(id: string): IAccessStrategy {
    const strategy = this.strategies.get(id)
    if (!strategy) {
      throw new Error(`[AccessStrategyRegistry] Unknown access strategy: "${id}"`)
    }
    return strategy
  }

  /**
   * Get a strategy by ID (safe)
   *
   * @param id - Strategy ID
   * @returns access strategy or undefined
   */
  find(id: string): IAccessStrategy | undefined {
    return this.strategies.get(id)
  }

  /**
   * Get all registered strategies
   *
   * @returns array of all access strategies
   */
  getAll(): IAccessStrategy[] {
    return Array.from(this.strategies.values())
  }

  /**
   * Check access using multiple strategies
   * Combines results based on survey's combine mode (AND/OR)
   *
   * @param user - User attempting to access
   * @param survey - Survey being accessed
   * @param strategyIds - Array of strategy IDs to check
   * @returns combined access check result
   */
  async checkAccess(
    user: User,
    survey: Survey,
    strategyIds: string[]
  ): Promise<AccessCheckResult> {
    // Validate inputs
    if (!user) {
      return {
        allowed: false,
        reason: 'User information is required'
      }
    }

    if (!survey) {
      return {
        allowed: false,
        reason: 'Survey information is required'
      }
    }

    if (!strategyIds || strategyIds.length === 0) {
      // No strategies configured = allow access
      return { allowed: true }
    }

    try {
      // Get strategies and validate they exist
      const strategies = strategyIds
        .map(id => {
          const strategy = this.find(id)
          if (!strategy) {
            console.warn(`[AccessStrategyRegistry] Strategy "${id}" not found, skipping`)
            return null
          }
          return strategy
        })
        .filter((s): s is IAccessStrategy => s !== null)
        .sort((a, b) => b.getConfig().priority - a.getConfig().priority)

      if (strategies.length === 0) {
        console.warn('[AccessStrategyRegistry] No valid strategies found, allowing access')
        return { allowed: true }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[AccessStrategyRegistry] Checking access with strategies:`,
          strategies.map(s => s.name)
        )
      }

      // Determine combine mode from survey config
      const combineMode = survey.accessCombineMode || 'AND'

      // Run all strategy checks with timeout (5 seconds per strategy)
      const STRATEGY_TIMEOUT = 5000
      const results = await Promise.all(
        strategies.map(async strategy => {
          try {
            const checkPromise = strategy.checkAccess(user, survey)
            const timeoutPromise = new Promise<AccessCheckResult>((_, reject) =>
              setTimeout(() => reject(new Error('Access check timeout')), STRATEGY_TIMEOUT)
            )

            const result = await Promise.race([checkPromise, timeoutPromise])

            if (process.env.NODE_ENV === 'development') {
              console.log(
                `[AccessStrategyRegistry] ${strategy.name}: ${result.allowed ? '✅ allowed' : '❌ denied'}`,
                result.reason || ''
              )
            }

            return result
          } catch (error) {
            console.error(`[AccessStrategyRegistry] Error checking strategy ${strategy.name}:`, error)

            // For timeout errors, allow graceful degradation
            const isTimeout = error instanceof Error && error.message.includes('timeout')

            return {
              allowed: false,
              reason: isTimeout
                ? "We couldn't verify your access. Please try again in a moment."
                : `Access check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }
          }
        })
      )

      // Combine results based on mode
      if (combineMode === 'AND') {
        // All must pass (AND logic)
        const failed = results.find(r => !r.allowed)
        if (failed) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[AccessStrategyRegistry] ❌ Access denied (AND mode)`)
          }
          return failed
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`[AccessStrategyRegistry] ✅ Access allowed (AND mode - all checks passed)`)
        }
        return { allowed: true }
      } else {
        // At least one must pass (OR logic)
        const passed = results.find(r => r.allowed)
        if (passed) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[AccessStrategyRegistry] ✅ Access allowed (OR mode - at least one check passed)`)
          }
          return { allowed: true }
        }

        // All failed - return first failure with action required (if any)
        const failureWithAction = results.find(r => r.requiresAction)
        const result = failureWithAction || results[0]

        if (process.env.NODE_ENV === 'development') {
          console.log(`[AccessStrategyRegistry] ❌ Access denied (OR mode - all checks failed)`)
        }

        return result
      }
    } catch (error) {
      console.error('[AccessStrategyRegistry] Error during access check:', error)
      return {
        allowed: false,
        reason: error instanceof Error ? error.message : 'Access check failed',
      }
    }
  }

  /**
   * Check if a strategy is registered
   *
   * @param id - Strategy ID
   * @returns true if registered
   */
  has(id: string): boolean {
    return this.strategies.has(id)
  }

  /**
   * Reset registry (mainly for testing)
   * Clears all strategies
   */
  reset(): void {
    this.strategies.clear()

    if (process.env.NODE_ENV === 'development') {
      console.log('[AccessStrategyRegistry] Registry reset')
    }
  }
}

// Export singleton instance
export const accessStrategyRegistry = AccessStrategyRegistry.getInstance()
