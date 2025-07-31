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
    // HttpOnly cookie is set by backend, no client-side token management needed
    return response
  }


  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const result = await apiClient.get<{ user: User }>('/auth/me')
    return result.user
  }

  /**
   * Disconnect wallet (logout)
   */
  async disconnect(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/disconnect')
    // HttpOnly cookie is cleared by backend, no client-side action needed
    return response
  }

  /**
   * Check if user is authenticated by validating token
   */
  async checkAuth(): Promise<User | null> {
    try {
      return await this.getMe()
    } catch (error) {
      // HttpOnly cookie is invalid or expired - no client-side action needed
      return null
    }
  }
}

// Export singleton instance
export const authApi = new AuthApi()
export default authApi
