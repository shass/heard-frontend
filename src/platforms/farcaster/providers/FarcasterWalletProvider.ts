import { 
  IWalletProvider, 
  WalletConnection, 
  TransactionRequest 
} from '../../_core/shared/interfaces/IWalletProvider'

export class FarcasterWalletProvider implements IWalletProvider {
  private accountChangeCallbacks: Set<(account: string | null) => void> = new Set()
  private chainChangeCallbacks: Set<(chainId: number) => void> = new Set()
  private ethereumProvider: any = null
  
  constructor(private miniAppSdk: any) {
    this.initializeEthereumProvider()
  }
  
  private async initializeEthereumProvider(): Promise<void> {
    try {
      // Get EIP-1193 Ethereum Provider from Mini App SDK
      this.ethereumProvider = await this.miniAppSdk.wallet.getEthereumProvider()
      
      if (this.ethereumProvider) {
        // Set up event listeners
        this.setupEventListeners()
        console.log('[FarcasterWallet] Ethereum provider initialized')
      }
    } catch (error) {
      console.error('[FarcasterWallet] Failed to initialize Ethereum provider:', error)
    }
  }
  
  private setupEventListeners(): void {
    if (!this.ethereumProvider) return
    
    // Listen for account changes
    this.ethereumProvider.on('accountsChanged', (accounts: string[]) => {
      const account = accounts.length > 0 ? accounts[0] : null
      this.notifyAccountChange(account)
    })
    
    // Listen for chain changes
    this.ethereumProvider.on('chainChanged', (chainId: string) => {
      const chainIdNumber = parseInt(chainId, 16)
      this.notifyChainChange(chainIdNumber)
    })
    
    // Listen for connection status
    this.ethereumProvider.on('connect', (connectInfo: any) => {
      console.log('[FarcasterWallet] Connected to chain:', connectInfo.chainId)
    })
    
    this.ethereumProvider.on('disconnect', (error: any) => {
      console.log('[FarcasterWallet] Disconnected:', error)
      this.notifyAccountChange(null)
    })
  }
  
  private notifyAccountChange(account: string | null): void {
    this.accountChangeCallbacks.forEach(callback => callback(account))
  }
  
  private notifyChainChange(chainId: number): void {
    this.chainChangeCallbacks.forEach(callback => callback(chainId))
  }
  
  async connect(): Promise<WalletConnection> {
    try {
      if (!this.ethereumProvider) {
        throw new Error('Ethereum provider not available')
      }
      
      // Request account access
      const accounts = await this.ethereumProvider.request({
        method: 'eth_requestAccounts'
      })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available')
      }
      
      const address = accounts[0]
      
      // Get chain ID
      const chainId = await this.ethereumProvider.request({
        method: 'eth_chainId'
      })
      
      const chainIdNumber = parseInt(chainId, 16)
      
      return {
        address,
        chainId: chainIdNumber,
        provider: 'farcaster-miniapp'
      }
    } catch (error) {
      console.error('[FarcasterWallet] Connection failed:', error)
      throw error
    }
  }
  
  async disconnect(): Promise<void> {
    // Mini Apps don't typically have explicit disconnect
    // Notify callbacks about disconnection
    this.notifyAccountChange(null)
    console.log('[FarcasterWallet] Disconnected')
  }
  
  isConnected(): boolean {
    // Check if we have an active Ethereum provider
    return !!this.ethereumProvider
  }
  
  async getAddress(): Promise<string | null> {
    try {
      if (!this.ethereumProvider) return null
      
      const accounts = await this.ethereumProvider.request({
        method: 'eth_accounts'
      })
      
      return accounts && accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      console.error('[FarcasterWallet] Failed to get address:', error)
      return null
    }
  }
  
  async getBalance(): Promise<bigint | null> {
    try {
      if (!this.ethereumProvider) return null
      
      const address = await this.getAddress()
      if (!address) return null
      
      const balance = await this.ethereumProvider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
      
      return BigInt(balance)
    } catch (error) {
      console.error('[FarcasterWallet] Failed to get balance:', error)
      return null
    }
  }
  
  async getChainId(): Promise<number | null> {
    try {
      if (!this.ethereumProvider) return null
      
      const chainId = await this.ethereumProvider.request({
        method: 'eth_chainId'
      })
      
      return parseInt(chainId, 16)
    } catch (error) {
      console.error('[FarcasterWallet] Failed to get chain ID:', error)
      return null
    }
  }
  
  async signMessage(message: string): Promise<string> {
    try {
      if (!this.ethereumProvider) {
        throw new Error('Ethereum provider not available')
      }
      
      const address = await this.getAddress()
      if (!address) {
        throw new Error('No wallet address available')
      }
      
      const signature = await this.ethereumProvider.request({
        method: 'personal_sign',
        params: [message, address]
      })
      
      return signature
    } catch (error) {
      console.error('[FarcasterWallet] Message signing failed:', error)
      throw error
    }
  }
  
  async signTypedData(data: any): Promise<string> {
    try {
      if (!this.ethereumProvider) {
        throw new Error('Ethereum provider not available')
      }
      
      const address = await this.getAddress()
      if (!address) {
        throw new Error('No wallet address available')
      }
      
      const signature = await this.ethereumProvider.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify(data)]
      })
      
      return signature
    } catch (error) {
      console.error('[FarcasterWallet] Typed data signing failed:', error)
      throw error
    }
  }
  
  async sendTransaction(tx: TransactionRequest): Promise<string> {
    try {
      if (!this.ethereumProvider) {
        throw new Error('Ethereum provider not available')
      }
      
      // Convert transaction request to EIP-1193 format
      const ethTx: any = {
        to: tx.to,
        value: tx.value ? `0x${BigInt(tx.value).toString(16)}` : undefined,
        data: tx.data,
        gas: tx.gasLimit ? `0x${BigInt(tx.gasLimit).toString(16)}` : undefined,
        gasPrice: tx.gasPrice ? `0x${BigInt(tx.gasPrice).toString(16)}` : undefined
      }
      
      // Remove undefined values
      Object.keys(ethTx).forEach(key => {
        if (ethTx[key] === undefined) {
          delete ethTx[key]
        }
      })
      
      const txHash = await this.ethereumProvider.request({
        method: 'eth_sendTransaction',
        params: [ethTx]
      })
      
      return txHash
    } catch (error) {
      console.error('[FarcasterWallet] Transaction failed:', error)
      throw error
    }
  }
  
  async sendBatchTransaction(transactions: TransactionRequest[]): Promise<string> {
    try {
      if (!this.ethereumProvider) {
        throw new Error('Ethereum provider not available')
      }
      
      // Convert transactions to EIP-5792 batch format
      const batchTx = transactions.map(tx => ({
        to: tx.to,
        value: tx.value ? `0x${BigInt(tx.value).toString(16)}` : undefined,
        data: tx.data,
        gas: tx.gasLimit ? `0x${BigInt(tx.gasLimit).toString(16)}` : undefined,
        gasPrice: tx.gasPrice ? `0x${BigInt(tx.gasPrice).toString(16)}` : undefined
      }))
      
      // Use EIP-5792 batch transaction method
      const batchId = await this.ethereumProvider.request({
        method: 'wallet_sendBatch',
        params: [batchTx]
      })
      
      return batchId
    } catch (error) {
      // Fallback to individual transactions if batch not supported
      console.warn('[FarcasterWallet] Batch transaction not supported, falling back to individual transactions')
      
      const txHashes: string[] = []
      for (const tx of transactions) {
        const hash = await this.sendTransaction(tx)
        txHashes.push(hash)
      }
      
      // Return the last transaction hash
      return txHashes[txHashes.length - 1]
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
  
  // Farcaster Mini App specific methods
  getEthereumProvider(): any {
    return this.ethereumProvider
  }
  
  // Check if batch transactions are supported
  supportsBatchTransactions(): boolean {
    try {
      // Check if EIP-5792 is supported
      return !!this.ethereumProvider && 
             typeof this.ethereumProvider.request === 'function'
    } catch {
      return false
    }
  }
  
  // Get Mini App wallet capabilities
  getWalletCapabilities() {
    return {
      isConnected: this.isConnected(),
      supportsBatchTransactions: this.supportsBatchTransactions(),
      supportsTypedData: true,
      supportsPersonalSign: true,
      platform: 'farcaster-miniapp',
      provider: 'ethereum'
    }
  }
  
  // Get network information
  async getNetworkInfo() {
    const chainId = await this.getChainId()
    
    return {
      chainId,
      networkName: this.getNetworkName(chainId),
      isTestnet: this.isTestnet(chainId),
      blockExplorer: this.getBlockExplorer(chainId)
    }
  }
  
  private getNetworkName(chainId: number | null): string {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet'
      case 8453: return 'Base Mainnet'
      case 84532: return 'Base Sepolia'
      case 10: return 'Optimism'
      case 137: return 'Polygon'
      case 42161: return 'Arbitrum One'
      default: return `Chain ${chainId}`
    }
  }
  
  private isTestnet(chainId: number | null): boolean {
    const testnets = [5, 11155111, 84532, 421614] // Goerli, Sepolia, Base Sepolia, Arbitrum Sepolia
    return testnets.includes(chainId || 0)
  }
  
  private getBlockExplorer(chainId: number | null): string {
    switch (chainId) {
      case 1: return 'https://etherscan.io'
      case 8453: return 'https://basescan.org'
      case 84532: return 'https://sepolia.basescan.org'
      case 10: return 'https://optimistic.etherscan.io'
      case 137: return 'https://polygonscan.com'
      case 42161: return 'https://arbiscan.io'
      default: return ''
    }
  }
}