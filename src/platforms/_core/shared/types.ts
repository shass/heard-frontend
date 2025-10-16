// Shared types for platform integrations

export interface TransactionRequest {
  to?: string
  from?: string
  value?: bigint | string
  data?: string
  gasLimit?: bigint | string
  gasPrice?: bigint | string
  nonce?: number
  chainId?: number
}

export interface WalletConnection {
  address: string
  chainId: number
  provider?: any
}
