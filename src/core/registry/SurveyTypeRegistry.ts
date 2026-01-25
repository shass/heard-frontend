/**
 * Survey Type Registry
 *
 * Singleton registry for managing survey type plugins.
 * Handles registration and access to survey type implementations.
 */

import { ISurveyType } from '../interfaces/ISurveyType'
import { IPlatformPlugin } from '../interfaces/IPlatformPlugin'

export class SurveyTypeRegistry {
  private static instance: SurveyTypeRegistry
  private types = new Map<string, ISurveyType>()

  /**
   * Get singleton instance
   */
  static getInstance(): SurveyTypeRegistry {
    if (!this.instance) {
      this.instance = new SurveyTypeRegistry()
    }
    return this.instance
  }

  /**
   * Register a survey type
   *
   * @param surveyType - Survey type to register
   * @throws if survey type with same ID already registered
   */
  register(surveyType: ISurveyType): void {
    if (this.types.has(surveyType.id)) {
      throw new Error(`[SurveyTypeRegistry] Survey type "${surveyType.id}" already registered`)
    }

    this.types.set(surveyType.id, surveyType)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SurveyTypeRegistry] Registered: ${surveyType.icon} ${surveyType.name} (${surveyType.id})`)
    }
  }

  /**
   * Unregister a survey type
   *
   * @param id - Survey type ID to unregister
   */
  unregister(id: string): void {
    this.types.delete(id)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SurveyTypeRegistry] Unregistered: ${id}`)
    }
  }

  /**
   * Get a survey type by ID
   *
   * @param id - Survey type ID
   * @returns survey type
   * @throws if survey type not found
   */
  get(id: string): ISurveyType {
    const type = this.types.get(id)
    if (!type) {
      throw new Error(`[SurveyTypeRegistry] Unknown survey type: "${id}"`)
    }
    return type
  }

  /**
   * Get a survey type by ID (safe)
   *
   * @param id - Survey type ID
   * @returns survey type or undefined
   */
  find(id: string): ISurveyType | undefined {
    return this.types.get(id)
  }

  /**
   * Get all registered survey types
   *
   * @returns array of all survey types
   */
  getAll(): ISurveyType[] {
    return Array.from(this.types.values())
  }

  /**
   * Get survey types available for a specific platform
   * Filters by platform capabilities (wallet, etc.)
   *
   * @param platform - Platform to check compatibility with
   * @returns array of compatible survey types
   */
  getAvailableForPlatform(platform: IPlatformPlugin): ISurveyType[] {
    const features = platform.getFeatures()

    return this.getAll().filter(type => {
      const config = type.getConfig()

      // Check if survey type requires wallet
      if (config.requireWallet && !features.wallet) {
        return false
      }

      // Add more compatibility checks as needed
      // e.g., NFT ownership requires wallet
      if (config.requiresNftOwnership && !features.wallet) {
        return false
      }

      return true
    })
  }

  /**
   * Check if a survey type is registered
   *
   * @param id - Survey type ID
   * @returns true if registered
   */
  has(id: string): boolean {
    return this.types.has(id)
  }

  /**
   * Reset registry (mainly for testing)
   * Clears all survey types
   */
  reset(): void {
    this.types.clear()

    if (process.env.NODE_ENV === 'development') {
      console.log('[SurveyTypeRegistry] Registry reset')
    }
  }
}

// Export singleton instance
export const surveyTypeRegistry = SurveyTypeRegistry.getInstance()
