import { TransactionRequest } from '../types'

export interface IWalletStrategy {
  // State
  address: string | undefined
  isConnected: boolean
  chainId: number | undefined
  balance: string | undefined
  isLoading: boolean
  error: string | null

  // Core methods
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (tx: TransactionRequest) => Promise<string>
  getConnectors: () => Array<{
    id: string
    name: string
    icon?: string
    type: string
    ready: boolean
  }>

  // Capabilities
  canConnect: boolean
  canSignMessage: boolean
  canSendTransaction: boolean
}
