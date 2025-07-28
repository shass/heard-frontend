// Users API endpoints

import { apiClient } from './client'
import type {
  User,
  HeardPointsTransaction,
  PaginationMeta
} from '@/lib/types'

export interface GetHeardPointsResponse {
  currentBalance: number
  totalEarned: number
  totalSpent: number
  transactionCount: number
}

export interface GetHeardPointsHistoryRequest {
  limit?: number
  offset?: number
  type?: 'earned' | 'spent' | 'bonus' | 'admin_adjustment'
}

export interface GetHeardPointsHistoryResponse {
  items: HeardPointsTransaction[]
  pagination: PaginationMeta
}


export class UserApi {
  /**
   * Get HeardPoints balance and statistics
   */
  async getHeardPoints(): Promise<GetHeardPointsResponse> {
    const response = await apiClient.get<{
      balance: number
      totalEarned: number
      totalSpent: number
      recentTransactions: any[]
    }>('/users/me/heard-points')

    // Transform backend response to frontend format
    return {
      currentBalance: response.balance,
      totalEarned: response.totalEarned,
      totalSpent: response.totalSpent,
      transactionCount: response.recentTransactions?.length || 0
    }
  }

  /**
   * Get HeardPoints transaction history
   */
  async getHeardPointsHistory(params: GetHeardPointsHistoryRequest = {}): Promise<GetHeardPointsHistoryResponse> {
    const queryParams = new URLSearchParams()

    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.type) queryParams.append('type', params.type)

    const url = `/users/me/heard-points/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return await apiClient.get<GetHeardPointsHistoryResponse>(url)
  }


  /**
   * Get current user profile (same as auth.getMe but in user context)
   */
  async getCurrentUser(): Promise<User> {
    const result = await apiClient.get<{ user: User }>('/auth/me')
    return result.user
  }

  /**
   * Get user by ID (admin only)
   */
  async getUser(userId: string): Promise<User> {
    return await apiClient.get<User>(`/users/${userId}`)
  }

  /**
   * Get recent HeardPoints transactions (last 10)
   */
  async getRecentTransactions(): Promise<HeardPointsTransaction[]> {
    const response = await this.getHeardPointsHistory({ limit: 10, offset: 0 })
    return response.items
  }

  /**
   * Get HeardPoints summary for dashboard
   */
  async getHeardPointsSummary(): Promise<{
    balance: number
    recentTransactions: HeardPointsTransaction[]
    monthlyEarned: number
  }> {
    const [pointsData, recentTransactions] = await Promise.all([
      this.getHeardPoints(),
      this.getRecentTransactions()
    ])

    // Calculate monthly earned (rough estimate from recent transactions)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyEarned = recentTransactions
      .filter(tx =>
        tx.type === 'earned' &&
        new Date(tx.createdAt) >= thirtyDaysAgo
      )
      .reduce((sum, tx) => sum + tx.amount, 0)

    return {
      balance: pointsData.currentBalance,
      recentTransactions,
      monthlyEarned
    }
  }

  /**
   * Check if user has sufficient HeardPoints for action
   */
  async hasEnoughPoints(requiredPoints: number): Promise<{
    hasEnough: boolean
    currentBalance: number
    required: number
  }> {
    const { currentBalance } = await this.getHeardPoints()

    return {
      hasEnough: currentBalance >= requiredPoints,
      currentBalance: currentBalance,
      required: requiredPoints
    }
  }

}

// Export singleton instance
export const userApi = new UserApi()
export default userApi
