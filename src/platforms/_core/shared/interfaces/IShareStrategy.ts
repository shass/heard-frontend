export interface ShareOptions {
  url: string
  text?: string
  title?: string
}

export interface IShareStrategy {
  /**
   * Share content using platform-specific method
   * - Base App: HTTPS URL via native share API or clipboard
   * - Farcaster: HTTPS URL via composeCast (@farcaster/miniapp-sdk)
   * - Web: HTTPS URL via clipboard API
   *
   * All platforms now use /share/[id] URLs that are clickable in messengers
   * and auto-redirect to the appropriate platform when opened
   */
  share: (options: ShareOptions) => Promise<void>

  /**
   * Check if sharing is available on this platform
   */
  canShare: boolean
}
