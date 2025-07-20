import { apiClient } from './client'
import type { 
  AdminDashboardStats,
  AdminSurveyListItem,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  WhitelistEntry,
  WhitelistManagementData,
  BulkWhitelistRequest,
  Survey,
  SurveyResponse,
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
  
  console.log('🔍 Admin surveys data received:', data)
  
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

// Survey Responses Management
export const getSurveyResponses = async (surveyId: string, params?: {
  limit?: number
  offset?: number
  status?: 'completed' | 'in_progress' | 'all'
  search?: string
}): Promise<{ responses: SurveyResponse[]; meta: PaginationMeta }> => {
  const data = await apiClient.get<{
    items: SurveyResponse[]
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
    addresses: string[]
    total: number
    entries: WhitelistEntry[]
  }>(`/admin/surveys/${surveyId}/whitelist`, {
    params: {
      limit: params?.limit || 100,
      offset: params?.offset || 0,
      search: params?.search
    }
  })
  
  console.log('🔍 Whitelist data received for survey', surveyId, ':', data)
  
  return {
    surveyId,
    entries: data.entries || [],
    totalEntries: data.total || 0
  }
}

export const addWhitelistEntry = async (surveyId: string, walletAddress: string): Promise<WhitelistEntry> => {
  const data = await apiClient.post<WhitelistEntry>(`/admin/surveys/${surveyId}/whitelist/add`, {
    walletAddress
  })
  
  return data
}

export const bulkAddWhitelistEntries = async (request: BulkWhitelistRequest): Promise<WhitelistEntry[]> => {
  const data = await apiClient.post<WhitelistEntry[]>(`/admin/surveys/${request.surveyId}/whitelist/bulk-add`, {
    walletAddresses: request.walletAddresses
  })
  
  return data
}

export const removeWhitelistEntry = async (surveyId: string, entryId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist/${entryId}`)
}

export const toggleWhitelistEntry = async (surveyId: string, entryId: string, isActive: boolean): Promise<WhitelistEntry> => {
  const data = await apiClient.patch<WhitelistEntry>(`/admin/surveys/${surveyId}/whitelist/${entryId}/toggle`, {
    isActive
  })
  
  return data
}

export const clearWhitelist = async (surveyId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist`)
}

export const importWhitelistFromCSV = async (surveyId: string, file: File): Promise<WhitelistEntry[]> => {
  const data = await apiClient.uploadFile<WhitelistEntry[]>(`/admin/surveys/${surveyId}/whitelist/csv`, file)
  
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
  role?: 'all' | 'admin' | 'survey_creator' | 'respondent'
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

export const adjustUserHerdPoints = async (userId: string, amount: number, reason: string): Promise<User> => {
  const data = await apiClient.post<User>(`/admin/users/${userId}/herd-points/adjust`, {
    amount,
    reason
  })
  return data
}
