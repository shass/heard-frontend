// Environment variables with TypeScript support

// Validate required environment variables only on server side
const requiredEnvVars = [
  'NEXT_PUBLIC_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_API_TIMEOUT',
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
  'NEXT_PUBLIC_CDP_CLIENT_API_KEY',
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_ENVIRONMENT',
  'NEXT_PUBLIC_URL',
  'NEXT_PUBLIC_FARCASTER_HEADER',
  'NEXT_PUBLIC_FARCASTER_PAYLOAD',
  'NEXT_PUBLIC_FARCASTER_SIGNATURE',
] as const

// Only validate on server side during build/startup
if (typeof window === 'undefined') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }
}

export const env = {
  PUBLIC_URL: process.env.NEXT_PUBLIC_URL,

  // Backend API
  API_URL: process.env.NEXT_PUBLIC_API_URL!,
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),

  // Web3
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  CDP_CLIENT_API_KEY: process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY!,

  // App
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME!,
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT!,

  // Farcaster Manifest (server-side only, for Base catalog)
  FARCASTER_HEADER: process.env.NEXT_PUBLIC_FARCASTER_HEADER!,
  FARCASTER_PAYLOAD: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD!,
  FARCASTER_SIGNATURE: process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE!,
} as const

export default env
