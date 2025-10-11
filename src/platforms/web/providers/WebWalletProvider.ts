import { 
  IWalletProvider, 
  WalletConnection, 
  TransactionRequest 
} from '../_core/shared/interfaces/IWalletProvider'
import { useAccount, useConnect, useDisconnect, useSignMessage, useBalance, useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

export class WebWalletProvider implements IWalletProvider {
  private accountChangeCallbacks: Set<(account: string | null) => void> = new Set()
  private chainChangeCallbacks: Set<(chainId: number) => void> = new Set()
  
  constructor(
    private wagmiHooks: {
      account: ReturnType<typeof useAccount>
      connect: ReturnType<typeof useConnect>
      disconnect: ReturnType<typeof useDisconnect>
      signMessage: ReturnType<typeof useSignMessage>
      balance: ReturnType<typeof useBalance>
      sendTransaction: ReturnType<typeof useSendTransaction>
    }
  ) {
    // Set up event listeners for wagmi state changes
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    // Monitor address changes
    const currentAddress = this.wagmiHooks.account.address
    let previousAddress = currentAddress
    
    // We'll need to poll or use effects in the React component that creates this provider
    // This is a limitation of using wagmi hooks in a class
  }
  
  async connect(): Promise<WalletConnection> {
    const { connect, connectors } = this.wagmiHooks.connect
    
    if (connectors.length === 0) {
      throw new Error('No connectors available')
    }
    
    // Connect with the first available connector (usually injected)
    const connector = connectors.find(c => c.type === 'injected') || connectors[0]
    
    try {
      const result = await connect({ connector })
      
      if (!result.accounts[0]) {
        throw new Error('No account returned from connection')
      }
      
      return {
        address: result.accounts[0],
        chainId: result.chainId,
        provider: connector
      }
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error}`)
    }
  }
  
  async disconnect(): Promise<void> {
    const { disconnect } = this.wagmiHooks.disconnect
    await disconnect()
  }
  
  isConnected(): boolean {
    return this.wagmiHooks.account.isConnected
  }
  
  async getAddress(): Promise<string | null> {
    return this.wagmiHooks.account.address || null
  }
  
  async getBalance(): Promise<bigint | null> {
    const { data } = this.wagmiHooks.balance
    return data?.value || null
  }
  
  async getChainId(): Promise<number | null> {
    return this.wagmiHooks.account.chainId || null
  }
  
  async signMessage(message: string): Promise<string> {
    const { signMessageAsync } = this.wagmiHooks.signMessage
    
    try {
      const signature = await signMessageAsync({ message })
      return signature
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }
  
  async signTypedData(data: any): Promise<string> {
    // For now, fall back to signMessage with JSON string
    // In a full implementation, we'd use useSignTypedData hook
    return this.signMessage(JSON.stringify(data))
  }
  
  async sendTransaction(tx: TransactionRequest): Promise<string> {
    const { sendTransactionAsync } = this.wagmiHooks.sendTransaction
    
    try {
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        value: tx.value ? BigInt(tx.value.toString()) : undefined,
        data: tx.data as `0x${string}` | undefined,
        gas: tx.gasLimit ? BigInt(tx.gasLimit.toString()) : undefined,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice.toString()) : undefined,
      })
      
      return hash
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`)
    }
  }
  
  onAccountChange(callback: (account: string | null) => void): () => void {
    this.accountChangeCallbacks.add(callback)
    
    // Immediately call with current account
    callback(this.wagmiHooks.account.address || null)
    
    return () => {
      this.accountChangeCallbacks.delete(callback)
    }
  }
  
  onChainChange(callback: (chainId: number) => void): () => void {
    this.chainChangeCallbacks.add(callback)
    
    // Immediately call with current chain
    const chainId = this.wagmiHooks.account.chainId
    if (chainId) {
      callback(chainId)
    }
    
    return () => {
      this.chainChangeCallbacks.delete(callback)
    }
  }
  
  // Internal method to notify about account changes
  notifyAccountChange(address: string | null): void {
    this.accountChangeCallbacks.forEach(callback => callback(address))
  }
  
  // Internal method to notify about chain changes
  notifyChainChange(chainId: number): void {
    this.chainChangeCallbacks.forEach(callback => callback(chainId))
  }
  
  // Getter for current wagmi state (useful for debugging)
  getWagmiState() {
    return {
      address: this.wagmiHooks.account.address,
      isConnected: this.wagmiHooks.account.isConnected,
      chainId: this.wagmiHooks.account.chainId,
      balance: this.wagmiHooks.balance.data?.value,
    }
  }
}