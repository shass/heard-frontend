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

export interface UpdateUserRequest {
  role?: 'respondent' | 'admin'
  isActive?: boolean
}

export interface AdjustHeardPointsRequest {
  amount: number
  description: string
}

export interface AdjustHeardPointsResponse {
  transaction: HeardPointsTransaction
  newBalance: number
}

export interface GetAllUsersRequest {
  limit?: number
  offset?: number
  role?: 'respondent' | 'admin'
  isActive?: boolean
  search?: string
}

export interface GetAllUsersResponse {
  users: User[]
  total: number
  meta: {
    pagination: PaginationMeta
  }
}

export class UserApi {
  /**
   * Get HeardPoints balance and statistics
   */
  async getHeardPoints(): Promise<GetHeardPointsResponse> {
    return await apiClient.get<GetHeardPointsResponse>('/users/me/heard-points')
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
   * Update user profile (admin only)
   */
  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    return await apiClient.put<User>(`/users/${userId}`, request)
  }

  /**
   * Adjust HeardPoints balance (admin only)
   */
  async adjustHeardPoints(userId: string, request: AdjustHeardPointsRequest): Promise<AdjustHeardPointsResponse> {
    return await apiClient.post<AdjustHeardPointsResponse>(`/users/${userId}/heard-points/adjust`, request)
  }

  /**
   * Get all users with filtering (admin only)
   */
  async getAllUsers(params: GetAllUsersRequest = {}): Promise<GetAllUsersResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.role) queryParams.append('role', params.role)
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params.search) queryParams.append('search', params.search)

    const url = `/users/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return await apiClient.get<GetAllUsersResponse>(url)
  }

  /**
   * Get current user profile (same as auth.getMe but in user context)
   */
  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>('/auth/me')
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

  /**
   * Search users by wallet address or partial match (admin only)
   */
  async searchUsers(query: string, params: GetAllUsersRequest = {}): Promise<User[]> {
    const response = await this.getAllUsers({ 
      ...params, 
      search: query 
    })
    return response.users
  }
}

// Export singleton instance
export const userApi = new UserApi()
export default userApi
