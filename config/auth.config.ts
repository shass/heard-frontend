export const AUTH_SETTINGS = {
  jwt: {
    expiresIn: {
      web: 24 * 60 * 60 * 1000,     // 24 hours
      base: 7 * 24 * 60 * 60 * 1000, // 7 days
      farcaster: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    storageKey: 'auth-token',
    refreshThreshold: 60 * 60 * 1000 // 1 hour
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffFactor: 2
  },
  message: {
    template: 'Sign this message to authenticate with HEARD.\n\nNonce: {{nonce}}\nTimestamp: {{timestamp}}\nPlatform: {{platform}}',
    nonceLength: 32,
    timestampWindow: 5 * 60 * 1000 // 5 minutes
  }
} as const

export const ERROR_MESSAGES = {
  wallet: {
    notConnected: 'Please connect your wallet first',
    signatureFailed: 'Signature verification failed',
    networkError: 'Network connection error'
  },
  platform: {
    base: {
      authFailed: 'Base App authentication failed. Please try again.',
      networkIssue: 'Base App connection issue. Please check your connection.'
    },
    farcaster: {
      authFailed: 'Farcaster authentication failed. Please try again.',
      networkIssue: 'Farcaster connection issue. Please check your connection.'
    },
    web: {
      authFailed: 'Wallet authentication failed. Please check your wallet.',
      networkIssue: 'Connection failed. Please check your internet.'
    }
  }
} as const