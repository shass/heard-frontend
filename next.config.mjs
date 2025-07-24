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
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
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
  async rewrites() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // В development проксируем к локальному бэкенду
    // В production DigitalOcean App Platform роутит /api напрямую к backend сервису
    if (isDevelopment) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ]
    }
    
    // В production rewrites не нужны - DO роутит по HTTP Routes
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
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Bundle size optimizations
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          web3: {
            test: /[\\/]node_modules[\\/](wagmi|viem|@rainbow-me|@walletconnect)[\\/]/,
            name: 'web3',
            priority: 20,
            reuseExistingChunk: true,
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@tanstack)[\\/]/,
            name: 'ui',
            priority: 15,
            reuseExistingChunk: true,
          },
        },
      },
    }
    
    return config;
  },
}

export default withBundleAnalyzer(nextConfig)
