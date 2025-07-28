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
    
    // JWT token is now stored as HttpOnly cookie by backend
    // No need to store in localStorage anymore
    // Keep backward compatibility for responses that still include token
    if (response.token) {
      apiClient.setToken(response.token)
    }
    
    return response
  }


  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    console.log('🔍 Making /auth/me request')
    const result = await apiClient.get<{ user: User }>('/auth/me')
    console.log('✅ /auth/me response:', result)
    return result.user
  }

  /**
   * Disconnect wallet (logout)
   */
  async disconnect(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/disconnect')
    
    // Clear JWT token from localStorage (for backward compatibility)
    // HttpOnly cookie is cleared by backend
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