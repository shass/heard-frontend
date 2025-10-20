export interface ShareOptions {
  url: string
  text?: string
  title?: string
}

export interface IShareStrategy {
  /**
   * Share content using platform-specific method
   * - Base App: composeCast (@coinbase/onchainkit/minikit)
   * - Farcaster: composeCast (@farcaster/miniapp-sdk)
   * - Web: clipboard API
   */
  share: (options: ShareOptions) => Promise<void>

  /**
   * Check if sharing is available on this platform
   */
  canShare: boolean
}
