export interface IWalletProvider {
  // Connection
  connect(): Promise<WalletConnection>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Account info
  getAddress(): Promise<string | null>
  getBalance(): Promise<bigint | null>
  getChainId(): Promise<number | null>
  
  // Signing
  signMessage(message: string): Promise<string>
  signTypedData(data: any): Promise<string>
  
  // Transactions
  sendTransaction(tx: TransactionRequest): Promise<string>
  
  // Events
  onAccountChange(callback: (account: string | null) => void): () => void
  onChainChange(callback: (chainId: number) => void): () => void
}

export interface WalletConnection {
  address: string
  chainId: number
  provider: any // Platform-specific provider
}

export interface TransactionRequest {
  to: string
  value?: bigint
  data?: string
  gasLimit?: bigint
  gasPrice?: bigint
}