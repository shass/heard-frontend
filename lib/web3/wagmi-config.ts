// Extended wagmi configuration

import { createConfig, http } from 'wagmi'
import { mainnet, polygon, bsc, sepolia } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { env } from '@/lib/env'

// Extended wagmi configuration with custom connectors
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, bsc, ...(env.ENABLE_TESTNETS ? [sepolia] : [])] as const,
  connectors: [
    injected(),
    walletConnect({ 
      projectId: env.WALLETCONNECT_PROJECT_ID,
    }),
    coinbaseWallet({
      appName: env.APP_NAME,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}