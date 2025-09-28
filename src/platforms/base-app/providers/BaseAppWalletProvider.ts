import { 
  IWalletProvider, 
  WalletConnection, 
  TransactionRequest 
} from '../../shared/interfaces/IWalletProvider'

// MiniKit and OnchainKit imports
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'

export class BaseAppWalletProvider implements IWalletProvider {
  private accountChangeCallbacks: Set<(account: string | null) => void> = new Set()
  private chainChangeCallbacks: Set<(chainId: number) => void> = new Set()
  
  constructor(
    private miniKitContext: ReturnType<typeof useMiniKit>,
    private wagmiAccount: ReturnType<typeof useAccount>,
    private wagmiSendTransaction: ReturnType<typeof useSendTransaction>,
    private wagmiSignMessage: ReturnType<typeof useSignMessage>
  ) {
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    // Monitor wagmi account changes
    // In a real implementation, we'd use useEffect in the React component that creates this provider
  }
  
  async connect(): Promise<WalletConnection> {
    // In MiniKit, the wallet is automatically connected if user has context
    if (!(this.miniKitContext.context?.user as any)?.custody?.address) {
      throw new Error('No wallet address available in MiniKit context')
    }
    
    const address = (this.miniKitContext.context?.user as any)?.custody?.address
    const chainId = this.wagmiAccount.chainId || 8453 // Base mainnet
    
    return {
      address,
      chainId,
      provider: 'minikit' // MiniKit acts as the provider
    }
  }
  
  async disconnect(): Promise<void> {
    // MiniKit handles wallet connection automatically
    // We can notify callbacks about disconnection
    this.notifyAccountChange(null)
  }
  
  isConnected(): boolean {
    // Check if we have user context with custody address
    return !!((this.miniKitContext.context?.user as any)?.custody?.address || this.wagmiAccount.address)
  }
  
  async getAddress(): Promise<string | null> {
    // Prefer MiniKit context, fallback to wagmi
    return (
      (this.miniKitContext.context?.user as any)?.custody?.address ||
      this.wagmiAccount.address ||
      null
    )
  }
  
  async getBalance(): Promise<bigint | null> {
    // MiniKit doesn't directly provide balance, use wagmi if available
    // In a full implementation, we might call Base RPC directly
    return null
  }
  
  async getChainId(): Promise<number | null> {
    // MiniKit apps run on Base by default
    return this.wagmiAccount.chainId || 8453 // Base mainnet
  }
  
  async signMessage(message: string): Promise<string> {
    try {
      // Use wagmi's signMessage hook
      const signature = await this.wagmiSignMessage.signMessageAsync({ message })
      return signature
    } catch (error) {
      throw new Error(`Failed to sign message in Base App: ${error}`)
    }
  }
  
  async signTypedData(data: any): Promise<string> {
    // For now, fallback to signMessage with JSON string
    // In a full implementation, we'd use useSignTypedData
    return this.signMessage(JSON.stringify(data))
  }
  
  async sendTransaction(tx: TransactionRequest): Promise<string> {
    try {
      const hash = await this.wagmiSendTransaction.sendTransactionAsync({
        to: tx.to as `0x${string}`,
        value: tx.value ? BigInt(tx.value.toString()) : undefined,
        data: tx.data as `0x${string}` | undefined,
        gas: tx.gasLimit ? BigInt(tx.gasLimit.toString()) : undefined,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice.toString()) : undefined,
      })
      
      return hash
    } catch (error) {
      throw new Error(`Failed to send transaction in Base App: ${error}`)
    }
  }
  
  onAccountChange(callback: (account: string | null) => void): () => void {
    this.accountChangeCallbacks.add(callback)
    
    // Immediately call with current account
    this.getAddress().then(callback)
    
    return () => {
      this.accountChangeCallbacks.delete(callback)
    }
  }
  
  onChainChange(callback: (chainId: number) => void): () => void {
    this.chainChangeCallbacks.add(callback)
    
    // Immediately call with current chain
    this.getChainId().then(chainId => {
      if (chainId) callback(chainId)
    })
    
    return () => {
      this.chainChangeCallbacks.delete(callback)
    }
  }
  
  // Internal methods to notify about changes
  notifyAccountChange(address: string | null): void {
    this.accountChangeCallbacks.forEach(callback => callback(address))
  }
  
  notifyChainChange(chainId: number): void {
    this.chainChangeCallbacks.forEach(callback => callback(chainId))
  }
  
  // Base App specific methods
  getMiniKitInfo() {
    return {
      hasContext: !!this.miniKitContext.context,
      userAddress: (this.miniKitContext.context?.user as any)?.custody?.address,
      clientFid: this.miniKitContext.context?.client?.clientFid,
      platform: 'base-app'
    }
  }
  
  // Check if we're in a proper MiniKit environment
  isInMiniKitEnvironment(): boolean {
    return !!(
      this.miniKitContext.context?.client?.clientFid ||
      (typeof window !== 'undefined' && (window as any).MiniKit)
    )
  }
  
  // Get verification addresses for the user
  getVerificationAddresses(): string[] {
    return (this.miniKitContext.context?.user as any)?.verifications || []
  }
  
  // Get custody address (managed by Coinbase Wallet)
  getCustodyAddress(): string | null {
    return (this.miniKitContext.context?.user as any)?.custody?.address || null
  }
  
  // Get user's Farcaster profile info
  getUserProfile() {
    const user = this.miniKitContext.context?.user as any
    if (!user) return null
    
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      custody: user.custody,
      verifications: user.verifications
    }
  }
  
  // Base App transaction capabilities
  getTransactionCapabilities() {
    return {
      canSendTransactions: this.isConnected(),
      canSignMessages: this.isConnected(),
      canSignTypedData: false, // Limited in current implementation
      supportsGasless: true,   // Base App may support gasless transactions
      supportedChains: [8453], // Base mainnet
    }
  }
}