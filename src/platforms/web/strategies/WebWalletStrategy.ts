'use client'

import { TransactionRequest } from '../../_core/shared/types'
import { IWalletStrategy } from '../../_core/shared/interfaces/IWalletStrategy'

/**
 * Web wallet strategy class
 * Implements IWalletStrategy without using React hooks at class level
 */
export class WebWalletStrategy implements IWalletStrategy {
  private _isLoading: boolean = false
  private _error: string | null = null

  constructor(
    private wagmiHooks: {
      address: string | undefined
      isConnected: boolean
      chainId: number | undefined
      balance: bigint | undefined
      connect: (connector: any) => Promise<void>
      disconnect: () => Promise<void>
      signMessage: (message: string) => Promise<string>
      sendTransaction: (tx: any) => Promise<string>
      connectors: any[]
    }
  ) {}

  // State getters
  get address(): string | undefined {
    return this.wagmiHooks.address
  }

  get isConnected(): boolean {
    return this.wagmiHooks.isConnected
  }

  get chainId(): number | undefined {
    return this.wagmiHooks.chainId
  }

  get balance(): string | undefined {
    return this.wagmiHooks.balance?.toString()
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get error(): string | null {
    return this._error
  }

  get canConnect(): boolean {
    return this.wagmiHooks.connectors.length > 0
  }

  get canSignMessage(): boolean {
    return this.wagmiHooks.isConnected
  }

  get canSendTransaction(): boolean {
    return this.wagmiHooks.isConnected
  }

  // Core methods
  connect = async () => {
    if (this.wagmiHooks.connectors.length === 0) {
      this._error = 'No wallet connectors available'
      return
    }

    try {
      this._isLoading = true
      this._error = null
      await this.wagmiHooks.connect(this.wagmiHooks.connectors[0])
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Failed to connect wallet'
    } finally {
      this._isLoading = false
    }
  }

  disconnect = async () => {
    try {
      this._error = null
      await this.wagmiHooks.disconnect()
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Failed to disconnect wallet'
    }
  }

  signMessage = async (message: string) => {
    try {
      this._error = null
      return await this.wagmiHooks.signMessage(message)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign message'
      this._error = errorMsg
      throw new Error(errorMsg)
    }
  }

  sendTransaction = async (tx: TransactionRequest) => {
    try {
      this._isLoading = true
      this._error = null

      const hash = await this.wagmiHooks.sendTransaction({
        to: tx.to as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : undefined,
        data: tx.data as `0x${string}` | undefined,
      })

      return hash
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      this._error = errorMsg
      throw new Error(errorMsg)
    } finally {
      this._isLoading = false
    }
  }

  getConnectors = () => {
    return this.wagmiHooks.connectors.map((connector: any) => ({
      id: connector.id,
      name: connector.name,
      icon: connector.icon,
      type: connector.type,
      ready: true,
    }))
  }
}
