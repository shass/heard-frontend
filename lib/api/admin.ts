import { apiClient } from './client'
import {
  SurveyType,
  type AdminDashboardStats,
  type AdminSurveyListItem,
  type CreateSurveyRequest,
  type UpdateSurveyRequest,
  type WhitelistPagedData,
  type RewardLink,
  type UsedRewardLink,
  type RewardLinksData,
  type ImportRewardLinksRequest,
  type Survey,
  type AdminSurveyResponse,
  type User,
  type PaginationMeta,
  type WalletLookupResponse,
  type WalletResponseDetails
} from '../types'

// Admin Dashboard Stats
export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    // Note: apiClient.get() already extracts response.data.data and returns it directly
    const data = await apiClient.get<AdminDashboardStats>('/admin/dashboard')

    // Debug logging
    console.log('🔍 Admin dashboard data received:', data)

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response structure from admin dashboard API')
    }

    return data
  } catch (error: any) {
    console.error('🚨 Admin dashboard API error:', error)
    console.error('🚨 Error response:', error?.response?.data)

    // Check if it's an authentication error
    if (error?.response?.status === 401) {
      throw new Error('Authentication required. Please login as admin.')
    }

    // Check if it's an authorization error (not admin)
    if (error?.response?.status === 403) {
      throw new Error('Admin access required. You do not have permission to view this page.')
    }

    // For other errors, provide more context
    throw new Error(error?.response?.data?.error?.message || error?.message || 'Failed to load dashboard data')
  }
}

// Survey Management
export const getAdminSurveys = async (params?: {
  limit?: number
  offset?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  surveyType?: SurveyType | 'all'
}): Promise<{ surveys: AdminSurveyListItem[]; meta: PaginationMeta }> => {
  const data = await apiClient.get<{
    items: AdminSurveyListItem[]
    pagination: PaginationMeta
  }>('/admin/surveys', {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      search: params?.search,
      status: params?.status,
      surveyType: params?.surveyType === 'all' ? undefined : params?.surveyType
    }
  })

  return {
    surveys: data.items || [],
    meta: data.pagination || {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      total: data.items?.length || 0,
      hasMore: false
    }
  }
}

export const createSurvey = async (surveyData: CreateSurveyRequest): Promise<Survey> => {
  const data = await apiClient.post<Survey>('/admin/surveys', surveyData)

  // Call lifecycle hook after survey creation
  try {
    const { surveyTypeRegistry } = await import('@/src/core/registry/SurveyTypeRegistry')
    const surveyType = surveyTypeRegistry.get(data.surveyType)
    await surveyType.onSurveyCreate?.(data)
  } catch (error) {
    console.error('Survey type lifecycle hook failed:', error)
    // Don't block the main flow
  }

  return data
}

export const updateSurvey = async (surveyData: UpdateSurveyRequest): Promise<Survey> => {
  const data = await apiClient.put<Survey>(`/admin/surveys/${surveyData.id}`, surveyData)
  return data
}

export const deleteSurvey = async (surveyId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}`)
}

export const toggleSurveyStatus = async (surveyId: string, isActive: boolean): Promise<Survey> => {
  const data = await apiClient.patch<Survey>(`/admin/surveys/${surveyId}/status`, {
    isActive
  })
  return data
}

export const duplicateSurvey = async (surveyId: string, newName: string): Promise<Survey> => {
  const data = await apiClient.post<Survey>(`/admin/surveys/${surveyId}/duplicate`, {
    name: newName
  })
  return data
}

export const refreshSurveyStats = async (surveyId?: string): Promise<{ success: boolean; message: string }> => {
  const endpoint = surveyId
    ? `/admin/surveys/${surveyId}/refresh-stats`
    : '/admin/surveys/refresh-stats'

  const data = await apiClient.post<{ success: boolean; message: string }>(endpoint, {})
  return data
}

export const importSurveys = async (surveysData: any): Promise<{
  message: string
  imported: number
  failed: number
  errors?: Array<{ survey: string, error: string }>
}> => {
  const data = await apiClient.post<{
    message: string
    imported: number
    failed: number
    errors?: Array<{ survey: string, error: string }>
  }>('/admin/surveys/import', surveysData)
  return data
}

export const exportSurvey = async (surveyId: string): Promise<any> => {
  const data = await apiClient.get<any>(`/admin/surveys/${surveyId}/export`)
  return data
}

// Survey Responses Management
export const getSurveyResponses = async (surveyId: string, params?: {
  limit?: number
  offset?: number
  status?: 'completed' | 'in_progress' | 'all'
  search?: string
}): Promise<{ responses: AdminSurveyResponse[]; meta: PaginationMeta }> => {
  const data = await apiClient.get<{
    items: AdminSurveyResponse[]
    pagination: PaginationMeta
  }>(`/admin/surveys/${surveyId}/responses`, {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      status: params?.status || 'all',
      search: params?.search
    }
  })
  return {
    responses: data.items || [],
    meta: data.pagination || {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      total: data.items?.length || 0,
      hasMore: false
    }
  }
}

export const deleteSurveyResponse = async (surveyId: string, walletAddress: string): Promise<{
  message: string
  deletedCount: number
}> => {
  const data = await apiClient.delete<{
    message: string
    deletedCount: number
  }>(`/admin/surveys/${surveyId}/responses/${walletAddress}`)
  return data
}

export const exportSurveyResponsesCsv = async (
  surveyId: string,
  params?: { offset?: number; limit?: number }
): Promise<Blob> => {
  const searchParams = new URLSearchParams()
  if (params?.offset !== undefined) searchParams.append('offset', String(params.offset))
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit))

  const queryString = searchParams.toString()
  const url = `/admin/surveys/${surveyId}/responses/export${queryString ? `?${queryString}` : ''}`

  return apiClient.getBlob(url)
}

// New paginated whitelist function with search and completion status
export const getWhitelistEntriesPaged = async (surveyId: string, params?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<WhitelistPagedData> => {
  const data = await apiClient.get<WhitelistPagedData>(`/admin/surveys/${surveyId}/whitelist`, {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      search: params?.search,
      format: 'detailed'
    }
  })

  return data
}

export const removeWhitelistEntry = async (surveyId: string, entryId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist/${entryId}`)
}

export const clearWhitelist = async (surveyId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist`)
}

// New batch upload endpoints
export const createUploadSession = async (
  surveyId: string,
  totalAddresses: number,
  replaceMode: boolean,
  batchSize: number
): Promise<{
  sessionId: string
  surveyId: string
  totalAddresses: number
  processedAddresses: number
  totalBatches: number
  completedBatches: number
  replaceMode: boolean
  createdAt: string
  status: 'active' | 'completed' | 'failed' | 'cancelled'
}> => {
  const data = await apiClient.post<{
    sessionId: string
    surveyId: string
    totalAddresses: number
    processedAddresses: number
    totalBatches: number
    completedBatches: number
    replaceMode: boolean
    createdAt: string
    status: 'active' | 'completed' | 'failed' | 'cancelled'
  }>(`/admin/surveys/${surveyId}/whitelist/upload-session`, {
    totalAddresses,
    replaceMode,
    batchSize
  })
  return data
}

export const uploadAddressBatch = async (
  surveyId: string,
  sessionId: string,
  batchIndex: number,
  addresses: string[]
): Promise<{
  added: number
  skipped: number
  errors: Array<{
    value?: string
    message: string
    timestamp: string
  }>
}> => {
  const data = await apiClient.post<{
    added: number
    skipped: number
    errors: Array<{
      value?: string
      message: string
      timestamp: string
    }>
  }>(`/admin/surveys/${surveyId}/whitelist/batch`, {
    sessionId,
    batchIndex,
    addresses
  })
  return data
}

export const completeUploadSession = async (
  surveyId: string,
  sessionId: string
): Promise<{
  message: string
  sessionId: string
  finalStats: {
    total: number
    completed: number
    pending: number
  }
}> => {
  const data = await apiClient.post<{
    message: string
    sessionId: string
    finalStats: {
      total: number
      completed: number
      pending: number
    }
  }>(`/admin/surveys/${surveyId}/whitelist/upload-session/${sessionId}/complete`, {})
  return data
}

// Survey Questions Management
export const getSurveyQuestions = async (surveyId: string): Promise<{
  questions: Array<{
    id: string
    questionText: string
    questionType: 'single' | 'multiple'
    order: number
    isRequired: boolean
    answers: Array<{
      id: string
      text: string
      order: number
    }>
    responseCount: number
  }>
}> => {
  const data = await apiClient.get<{
    questions: Array<{
      id: string
      questionText: string
      questionType: 'single' | 'multiple'
      order: number
      isRequired: boolean
      answers: Array<{
        id: string
        text: string
        order: number
      }>
      responseCount: number
    }>
  }>(`/admin/surveys/${surveyId}/questions`)

  return data
}

// User Management
export const getUsers = async (params?: {
  limit?: number
  offset?: number
  search?: string
  role?: 'all' | 'admin' | 'respondent'
}): Promise<{ users: User[]; meta: PaginationMeta }> => {
  const data = await apiClient.get<{
    items: User[]
    pagination: PaginationMeta
  }>('/admin/users', {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      search: params?.search,
      role: params?.role || 'all'
    }
  })
  return {
    users: data.items || [],
    meta: data.pagination || {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      total: data.items?.length || 0,
      hasMore: false
    }
  }
}

export const updateUserRole = async (userId: string, role: User['role']): Promise<User> => {
  const data = await apiClient.patch<User>(`/admin/users/${userId}/role`, { role })
  return data
}

export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<User> => {
  const data = await apiClient.patch<User>(`/admin/users/${userId}/status`, { isActive })
  return data
}

export const adjustUserHeardPoints = async (userId: string, amount: number, reason: string): Promise<User> => {
  const data = await apiClient.post<User>(`/admin/users/${userId}/heard-points/adjust`, {
    amount,
    reason
  })
  return data
}

// Reward Links Management
export const getRewardLinks = async (surveyId: string): Promise<RewardLinksData> => {
  const data = await apiClient.get<{ rewards: RewardLinksData, stats: any }>(`/admin/surveys/${surveyId}/rewards`)
  return {
    unused: data.rewards.unused,
    used: data.rewards.used,
    stats: data.stats
  }
}

// Paginated reward links function
export const getRewardLinksPaged = async (surveyId: string, params?: {
  type: 'unused' | 'used'
  limit?: number
  offset?: number
  search?: string
}): Promise<{
  links: RewardLink[] | UsedRewardLink[]
  stats: { total: number; unused: number; used: number }
  meta: PaginationMeta
}> => {
  const data = await apiClient.get<{
    links: RewardLink[] | UsedRewardLink[]
    stats: { total: number; unused: number; used: number }
    meta: PaginationMeta
  }>(`/admin/surveys/${surveyId}/rewards/paged`, {
    params: {
      type: params?.type || 'unused',
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      search: params?.search
    }
  })

  return data
}

// Removed single reward link addition - only bulk import supported

export const deleteRewardLink = async (surveyId: string, rewardId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/rewards/${rewardId}`)
}

export const clearAllRewardLinks = async (surveyId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/rewards`)
}

export const importRewardLinks = async (surveyId: string, request: ImportRewardLinksRequest): Promise<{
  imported: number,
  skipped: number,
  failedLinks: string[],
  message: string
}> => {
  const data = await apiClient.post<{
    imported: number,
    skipped: number,
    failedLinks: string[],
    message: string
  }>(`/admin/surveys/${surveyId}/rewards/import`, request)
  return data
}

// Wallet Lookup
export const lookupWallet = async (walletAddress: string): Promise<WalletLookupResponse> => {
  const data = await apiClient.get<WalletLookupResponse>(`/admin/users/lookup/${walletAddress}`)
  return data
}

export const getWalletResponseDetails = async (
  walletAddress: string,
  surveyId: string
): Promise<WalletResponseDetails> => {
  const data = await apiClient.get<WalletResponseDetails>(
    `/admin/users/lookup/${walletAddress}/responses/${surveyId}`
  )
  return data
}

// Migrations
export interface MigrationMeta {
  name: string
  description: string
  createdAt: string
  author: string
  supportsDryRun: boolean
  estimatedDuration?: string
  affectedCollections: string[]
}

export interface MigrationChange {
  documentId: string
  collection: string
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface MigrationResult {
  affectedDocuments: number
  changes?: MigrationChange[]
  applied: boolean
  error?: string
  durationMs?: number
}

export interface MigrationStatus {
  filename: string
  meta: MigrationMeta
  status: 'pending' | 'applied' | 'failed'
  appliedAt?: string
  appliedBy?: string
  result?: {
    affectedDocuments: number
    durationMs: number
    success: boolean
    error?: string
  }
  blocked?: boolean
  blockedBy?: string
}

export interface MigrationListResponse {
  migrations: MigrationStatus[]
  total: number
  pending: number
  applied: number
}

export interface MigrationRunResponse {
  success: boolean
  result: MigrationResult
  error?: string
}

export const getMigrations = async (): Promise<MigrationListResponse> => {
  const data = await apiClient.get<MigrationListResponse>('/admin/migrations')
  return data
}

export const getMigration = async (filename: string): Promise<MigrationStatus> => {
  const data = await apiClient.get<MigrationStatus>(`/admin/migrations/${filename}`)
  return data
}

export const runMigration = async (
  filename: string,
  dryRun: boolean = false
): Promise<MigrationRunResponse> => {
  const data = await apiClient.post<MigrationRunResponse>(
    `/admin/migrations/${filename}/run`,
    { dryRun }
  )
  return data
}

export const dryRunMigration = async (filename: string): Promise<MigrationRunResponse> => {
  const data = await apiClient.post<MigrationRunResponse>(
    `/admin/migrations/${filename}/dry-run`,
    {}
  )
  return data
}
