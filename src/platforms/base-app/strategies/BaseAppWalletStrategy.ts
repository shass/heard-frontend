'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { IWalletStrategy } from '@/src/platforms/_core/shared/interfaces/IWalletStrategy'
import { TransactionRequest } from '@/src/platforms/_core/shared/types'

export class BaseAppWalletStrategy implements IWalletStrategy {
  private _address: string | undefined = undefined
  private _isLoading: boolean = false
  private _error: string | null = null
  private _onAddressResolved: ((address: string) => void) | undefined

  constructor(onAddressResolved?: (address: string) => void) {
    this._onAddressResolved = onAddressResolved
    this.initialize()
  }

  private async initialize() {
    try {
      const provider = await sdk.wallet.getEthereumProvider()
      if (provider) {
        const accounts = await provider.request({ method: 'eth_accounts' })
        this._address = accounts[0]
        if (this._address) {
          this._onAddressResolved?.(this._address)
        }
      }
    } catch (err) {
      console.error('[BaseAppWalletStrategy] Failed to get address:', err)
    }
  }

  get address(): string | undefined {
    return this._address
  }

  get isConnected(): boolean {
    return !!this._address
  }

  get chainId(): number | undefined {
    return 8453 // Base mainnet
  }

  get balance(): string | undefined {
    return undefined
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get error(): string | null {
    return this._error
  }

  get canConnect(): boolean {
    return false // Already connected
  }

  get canSignMessage(): boolean {
    return true
  }

  get canSendTransaction(): boolean {
    return true
  }

  connect = async () => {
    // Base Account is automatically connected
  }

  disconnect = async () => {
    // Cannot disconnect from Base Account
  }

  signMessage = async (message: string): Promise<string> => {
    try {
      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider || !this._address) {
        throw new Error('Wallet not available')
      }

      const signature = await provider.request({
        method: 'personal_sign',
        params: [message as `0x${string}`, this._address as `0x${string}`]
      }) as string

      return signature
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign message'
      this._error = errorMsg
      throw new Error(errorMsg)
    }
  }

  sendTransaction = async (tx: TransactionRequest): Promise<string> => {
    try {
      this._isLoading = true
      this._error = null

      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider || !this._address) {
        throw new Error('Wallet not available')
      }

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this._address as `0x${string}`,
          to: tx.to as `0x${string}` | undefined,
          value: tx.value?.toString() as `0x${string}` | undefined,
          data: tx.data as `0x${string}` | undefined,
        }]
      }) as string

      return txHash
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      this._error = errorMsg
      throw new Error(errorMsg)
    } finally {
      this._isLoading = false
    }
  }

  getConnectors = () => {
    return [{
      id: 'base-account',
      name: 'Base Account',
      type: 'injected',
      ready: true,
    }]
  }
}
