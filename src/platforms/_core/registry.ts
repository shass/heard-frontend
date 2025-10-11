import { Platform, PlatformConfig } from '../config'

export class PlatformRegistry {
  private static configs: Map<Platform, PlatformConfig> = new Map()
  
  static register(config: PlatformConfig): void {
    this.configs.set(config.name, config)
  }
  
  static get(platform: Platform): PlatformConfig | undefined {
    return this.configs.get(platform)
  }
  
  static getAll(): PlatformConfig[] {
    return Array.from(this.configs.values())
  }
}