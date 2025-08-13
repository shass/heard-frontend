import { apiClient } from './client'
import type { 
  AdminDashboardStats,
  AdminSurveyListItem,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  WhitelistEntry,
  WhitelistManagementData,
  WhitelistPagedData,
  BulkWhitelistRequest,
  RewardLink,
  RewardLinksData,
  ImportRewardLinksRequest,
  Survey,
  SurveyResponse,
  AdminSurveyResponse,
  User,
  ApiResponse,
  PaginationMeta
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
}): Promise<{ surveys: AdminSurveyListItem[]; meta: PaginationMeta }> => {
  const data = await apiClient.get<{
    items: AdminSurveyListItem[]
    pagination: PaginationMeta
  }>('/admin/surveys', {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      search: params?.search,
      status: params?.status
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
  const data = await apiClient.post<Survey>('/admin/surveys/create', surveyData)
  return data
}

export const updateSurvey = async (surveyData: UpdateSurveyRequest): Promise<Survey> => {
  const data = await apiClient.put<Survey>(`/admin/surveys/${surveyData.id}/update`, surveyData)
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

export const exportSurveyResponses = async (surveyId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
  const data = await apiClient.get<Blob>(`/admin/surveys/${surveyId}/export`, {
    params: { format },
    responseType: 'blob'
  })
  return data
}

// Whitelist Management
export const getWhitelistEntries = async (surveyId: string, params?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<WhitelistManagementData> => {
  const data = await apiClient.get<{
    whitelist: string[]
  }>(`/admin/surveys/${surveyId}/whitelist`, {
    params: {
      limit: params?.limit || 100,
      offset: params?.offset || 0,
      search: params?.search,
      format: 'simple'
    }
  })
  
  return {
    surveyId,
    entries: data.whitelist || [],
    totalEntries: data.whitelist?.length || 0
  }
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

export const addWhitelistEntry = async (surveyId: string, walletAddress: string): Promise<{ message: string, addedAddress: string }> => {
  const data = await apiClient.post<{ message: string, addedAddress: string }>(`/admin/surveys/${surveyId}/whitelist/add`, {
    walletAddress
  })
  
  return data
}

// WebSocket Upload - processes all uploads via WebSocket for reliability
export const uploadWhitelist = async (surveyId: string, data: { 
  addresses?: string[]
  file?: File 
  replaceMode?: boolean 
}): Promise<{
  method: 'sync' | 'async'
  itemCount: number
  strategy: {
    batchSize: number
    description: string
    estimatedTime: string
  }
  validation: {
    valid: boolean
    warnings: string[]
    errors: string[]
  }
  recommendations: {
    webSocketRecommended: boolean
    chunkedUploadRecommended: boolean
    memoryWarning: boolean
    tips: string[]
  }
  jobId?: string
  addedItems?: number
  skippedItems?: number
  errors?: Array<{
    message: string
    timestamp: string
    line?: number
    value?: string
  }>
  processingTime?: number
  eta?: {
    estimatedSeconds: number
    estimatedCompletion: string
  }
  message: string
}> => {
  let requestConfig: any = {
    url: `/admin/surveys/${surveyId}/whitelist/upload`,
    method: 'POST'
  }

  if (data.file) {
    // File upload - use multipart/form-data
    const formData = new FormData()
    formData.append('file', data.file)
    if (data.replaceMode) {
      formData.append('replaceMode', 'true')
    }
    
    requestConfig.data = formData
    requestConfig.headers = {
      'Content-Type': 'multipart/form-data'
    }
  } else if (data.addresses) {
    // JSON array - use application/json
    requestConfig.data = {
      walletAddresses: data.addresses,
      replaceMode: data.replaceMode || false
    }
    requestConfig.headers = {
      'Content-Type': 'application/json'
    }
  } else {
    throw new Error('Either addresses array or file must be provided')
  }

  const response = await apiClient.post<any>(
    requestConfig.url,
    requestConfig.data,
    { headers: requestConfig.headers }
  )
  
  return response
}

// Удалено - используем только WebSocket для трекинга прогресса

export const removeWhitelistEntry = async (surveyId: string, entryId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist/${entryId}`)
}

export const toggleWhitelistEntry = async (surveyId: string, entryId: string, isActive: boolean): Promise<{ message: string, address: string, inWhitelist: boolean }> => {
  const data = await apiClient.patch<{ message: string, address: string, inWhitelist: boolean }>(`/admin/surveys/${surveyId}/whitelist/${entryId}/toggle`, {
    isActive
  })
  
  return data
}

export const clearWhitelist = async (surveyId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist`)
}

// Note: CSV import is not yet implemented on backend
export const importWhitelistFromCSV = async (surveyId: string, file: File): Promise<any> => {
  throw new Error('CSV upload functionality is not yet implemented. Please use TXT file import instead.')
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
