import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_CDP_CLIENT_API_KEY: process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    // Farcaster manifest variables (server-side)
    FARCASTER_HEADER: process.env.FARCASTER_HEADER,
    FARCASTER_PAYLOAD: process.env.FARCASTER_PAYLOAD,
    FARCASTER_SIGNATURE: process.env.FARCASTER_SIGNATURE,
  },
  // Development indicators
  devIndicators: {
    position: 'bottom-left',
  },
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  // API Route handler теперь обрабатывает проксирование
  // Эта конфигурация остается для случая локального backend
  async rewrites() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const useProductionBackend = process.env.USE_PRODUCTION_BACKEND === 'true'

    // Только для локального backend используем rewrites
    if (isDevelopment && !useProductionBackend) {
      console.log(`[Next.js] API proxy configured to local backend: http://localhost:3001/api/:path*`)

      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ]
    }

    // Для production backend используется API Route handler
    if (isDevelopment && useProductionBackend) {
      console.log(`[Next.js] Using API Route handler for production backend proxy`)
    }

    return []
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
}

export default withBundleAnalyzer(nextConfig)
