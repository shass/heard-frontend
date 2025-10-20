/**
 * Web platform URL opening strategy
 * Uses standard window.open
 */
export function useWebUrlStrategy() {
  const openUrl = async (url: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return { openUrl }
}
