/**
 * Interface for platform-specific URL opening strategies
 * Returns an object with openUrl method
 */
export interface IUrlStrategy {
  openUrl: (url: string) => Promise<void>
}
