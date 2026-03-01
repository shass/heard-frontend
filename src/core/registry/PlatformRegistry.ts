/**
 * Platform Registry
 *
 * Singleton registry for managing platform plugins.
 * Handles platform detection, activation, and access to the active platform.
 */

import { IPlatformPlugin } from '../interfaces/IPlatformPlugin'

export class PlatformRegistry {
  private static instance: PlatformRegistry
  private plugins = new Map<string, IPlatformPlugin>()
  private activePlugin: IPlatformPlugin | null = null
  private isDetecting = false

  /**
   * Get singleton instance
   */
  static getInstance(): PlatformRegistry {
    if (!this.instance) {
      this.instance = new PlatformRegistry()
    }
    return this.instance
  }

  /**
   * Register a platform plugin
   *
   * @param plugin - Platform plugin to register
   * @throws if plugin with same ID already registered
   */
  register(plugin: IPlatformPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`[PlatformRegistry] Plugin "${plugin.id}" already registered`)
    }

    this.plugins.set(plugin.id, plugin)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PlatformRegistry] Registered: ${plugin.name} (${plugin.id}) v${plugin.version}`)
    }
  }

  /**
   * Unregister a platform plugin
   *
   * @param id - Plugin ID to unregister
   */
  unregister(id: string): void {
    this.plugins.delete(id)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PlatformRegistry] Unregistered: ${id}`)
    }
  }

  /**
   * Detect and activate the appropriate platform
   *
   * Runs detection on all registered platforms,
   * selects the one with highest priority that detects as active,
   * and activates it.
   *
   * @returns activated platform plugin
   * @throws if no platform detected or detection already in progress
   */
  async detectAndActivate(): Promise<IPlatformPlugin> {
    if (this.isDetecting) {
      throw new Error('[PlatformRegistry] Detection already in progress')
    }

    if (this.plugins.size === 0) {
      throw new Error('[PlatformRegistry] No platforms registered')
    }

    this.isDetecting = true

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PlatformRegistry] Starting platform detection...')
      }

      // Run detection on all plugins with timeout per plugin
      const DETECTION_TIMEOUT = 3000
      const detectionResults = await Promise.all(
        Array.from(this.plugins.values()).map(async (plugin) => {
          try {
            const detectionPromise = plugin.detect()
            const timeoutPromise = new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error('Detection timeout')), DETECTION_TIMEOUT)
            )

            const detected = await Promise.race([detectionPromise, timeoutPromise])

            if (process.env.NODE_ENV === 'development') {
              console.log(`[PlatformRegistry] ${plugin.name}: ${detected ? '✅ detected' : '❌ not detected'}`)
            }

            return {
              plugin,
              detected,
              priority: plugin.getPriority(),
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`[PlatformRegistry] Detection error for ${plugin.name}:`, error)
            }
            return {
              plugin,
              detected: false,
              priority: -1,
            }
          }
        })
      )

      // Filter detected platforms and sort by priority (highest first)
      const detected = detectionResults
        .filter(r => r.detected)
        .sort((a, b) => b.priority - a.priority)

      if (detected.length === 0) {
        throw new Error('[PlatformRegistry] No platform detected. Check platform plugin detection logic.')
      }

      if (process.env.NODE_ENV === 'development' && detected.length > 1) {
        console.warn(
          `[PlatformRegistry] Multiple platforms detected:`,
          detected.map(d => `${d.plugin.name} (priority: ${d.priority})`)
        )
      }

      const winner = detected[0].plugin

      // Deactivate current platform if different
      if (this.activePlugin && this.activePlugin.id !== winner.id) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PlatformRegistry] Deactivating: ${this.activePlugin.name}`)
        }

        try {
          await this.activePlugin.onDeactivate?.()
        } catch (error) {
          console.error(`[PlatformRegistry] Deactivation error:`, error)
        }
      }

      // Activate new platform
      if (!this.activePlugin || this.activePlugin.id !== winner.id) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PlatformRegistry] Activating: ${winner.name}`)
        }

        try {
          await winner.onActivate?.()
          this.activePlugin = winner
        } catch (error) {
          console.error(`[PlatformRegistry] Activation error:`, error)
          throw new Error(`Failed to activate ${winner.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[PlatformRegistry] ✅ Active platform: ${winner.name}`)
      }

      return winner
    } finally {
      this.isDetecting = false
    }
  }

  /**
   * Get the currently active platform
   *
   * @returns active platform plugin
   * @throws if no platform has been activated
   */
  getActive(): IPlatformPlugin {
    if (!this.activePlugin) {
      throw new Error('[PlatformRegistry] No active platform. Call detectAndActivate() first.')
    }
    return this.activePlugin
  }

  /**
   * Get a specific platform plugin by ID
   *
   * @param id - Plugin ID
   * @returns platform plugin or undefined
   */
  get(id: string): IPlatformPlugin | undefined {
    return this.plugins.get(id)
  }

  /**
   * Get all registered platforms
   *
   * @returns array of all platform plugins
   */
  getAll(): IPlatformPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Check if a platform is registered
   *
   * @param id - Plugin ID
   * @returns true if registered
   */
  has(id: string): boolean {
    return this.plugins.has(id)
  }

  /**
   * Reset registry (mainly for testing)
   * Clears all plugins and deactivates active platform
   */
  reset(): void {
    if (this.activePlugin) {
      this.activePlugin.onDeactivate?.()
    }

    this.plugins.clear()
    this.activePlugin = null
    this.isDetecting = false

    if (process.env.NODE_ENV === 'development') {
      console.log('[PlatformRegistry] Registry reset')
    }
  }
}

// Export singleton instance
export const platformRegistry = PlatformRegistry.getInstance()
