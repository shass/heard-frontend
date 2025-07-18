// Authentication API endpoints

import { apiClient } from './client'
import type { 
  User, 
  AuthResponse, 
  NonceResponse, 
  ConnectWalletRequest 
} from '@/lib/types'

export class AuthApi {
  /**
   * Get nonce for wallet signature
   */
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    return await apiClient.post<NonceResponse>('/auth/nonce', {
      walletAddress,
    })
  }

  /**
   * Connect wallet with signature and get JWT token
   */
  async connectWallet(request: ConnectWalletRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/connect-wallet', request)
    
    // Store JWT token for future requests
    if (response.token) {
      apiClient.setToken(response.token)
    }
    
    return response
  }

  /**
   * Verify signature without creating session
   */
  async verifySignature(request: ConnectWalletRequest): Promise<{ valid: boolean; walletAddress: string }> {
    return await apiClient.post<{ valid: boolean; walletAddress: string }>('/auth/verify-signature', request)
  }

  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    return await apiClient.get<User>('/auth/me')
  }

  /**
   * Disconnect wallet (logout)
   */
  async disconnect(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/disconnect')
    
    // Clear JWT token
    apiClient.clearToken()
    
    return response
  }

  /**
   * Check if user is authenticated by validating token
   */
  async checkAuth(): Promise<User | null> {
    try {
      return await this.getMe()
    } catch (error) {
      // Token is invalid or expired
      apiClient.clearToken()
      return null
    }
  }
}

// Export singleton instance
export const authApi = new AuthApi()
export default authApi