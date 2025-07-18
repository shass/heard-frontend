// Users API endpoints

import { apiClient } from './client'
import type { 
  User, 
  HerdPointsTransaction,
  PaginationMeta
} from '@/lib/types'

export interface GetHerdPointsResponse {
  balance: number
  totalEarned: number
  totalSpent: number
  transactionCount: number
}

export interface GetHerdPointsHistoryRequest {
  limit?: number
  offset?: number
  type?: 'earned' | 'spent' | 'bonus' | 'admin_adjustment'
}

export interface GetHerdPointsHistoryResponse {
  transactions: HerdPointsTransaction[]
  total: number
  meta: {
    pagination: PaginationMeta
  }
}

export interface UpdateUserRequest {
  role?: 'respondent' | 'admin' | 'survey_creator'
  isActive?: boolean
}

export interface AdjustHerdPointsRequest {
  amount: number
  description: string
}

export interface AdjustHerdPointsResponse {
  transaction: HerdPointsTransaction
  newBalance: number
}

export interface GetAllUsersRequest {
  limit?: number
  offset?: number
  role?: 'respondent' | 'admin' | 'survey_creator'
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
   * Get HerdPoints balance and statistics
   */
  async getHerdPoints(): Promise<GetHerdPointsResponse> {
    return await apiClient.get<GetHerdPointsResponse>('/users/herd-points')
  }

  /**
   * Get HerdPoints transaction history
   */
  async getHerdPointsHistory(params: GetHerdPointsHistoryRequest = {}): Promise<GetHerdPointsHistoryResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.type) queryParams.append('type', params.type)

    const url = `/users/herd-points/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return await apiClient.get<GetHerdPointsHistoryResponse>(url)
  }

  /**
   * Update user profile (admin only)
   */
  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    return await apiClient.put<User>(`/users/${userId}`, request)
  }

  /**
   * Adjust HerdPoints balance (admin only)
   */
  async adjustHerdPoints(userId: string, request: AdjustHerdPointsRequest): Promise<AdjustHerdPointsResponse> {
    return await apiClient.post<AdjustHerdPointsResponse>(`/users/${userId}/herd-points/adjust`, request)
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
   * Get recent HerdPoints transactions (last 10)
   */
  async getRecentTransactions(): Promise<HerdPointsTransaction[]> {
    const response = await this.getHerdPointsHistory({ limit: 10, offset: 0 })
    return response.transactions
  }

  /**
   * Get HerdPoints summary for dashboard
   */
  async getHerdPointsSummary(): Promise<{
    balance: number
    recentTransactions: HerdPointsTransaction[]
    monthlyEarned: number
  }> {
    const [pointsData, recentTransactions] = await Promise.all([
      this.getHerdPoints(),
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
      balance: pointsData.balance,
      recentTransactions,
      monthlyEarned
    }
  }

  /**
   * Check if user has sufficient HerdPoints for action
   */
  async hasEnoughPoints(requiredPoints: number): Promise<{ 
    hasEnough: boolean
    currentBalance: number
    required: number
  }> {
    const { balance } = await this.getHerdPoints()
    
    return {
      hasEnough: balance >= requiredPoints,
      currentBalance: balance,
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