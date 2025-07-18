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
  const response = await apiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/stats')
  return response.data.data
}

// Survey Management
export const getAdminSurveys = async (params?: {
  limit?: number
  offset?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
}): Promise<{ surveys: AdminSurveyListItem[]; meta: PaginationMeta }> => {
  const response = await apiClient.get<ApiResponse<AdminSurveyListItem[]>>('/admin/surveys', {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      search: params?.search,
      status: params?.status || 'all'
    }
  })
  return {
    surveys: response.data.data,
    meta: response.data.meta?.pagination || {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      total: response.data.data.length,
      hasMore: false
    }
  }
}

export const createSurvey = async (surveyData: CreateSurveyRequest): Promise<Survey> => {
  const response = await apiClient.post<ApiResponse<Survey>>('/admin/surveys', surveyData)
  return response.data.data
}

export const updateSurvey = async (surveyData: UpdateSurveyRequest): Promise<Survey> => {
  const response = await apiClient.put<ApiResponse<Survey>>(`/admin/surveys/${surveyData.id}`, surveyData)
  return response.data.data
}

export const deleteSurvey = async (surveyId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}`)
}

export const toggleSurveyStatus = async (surveyId: string, isActive: boolean): Promise<Survey> => {
  const response = await apiClient.patch<ApiResponse<Survey>>(`/admin/surveys/${surveyId}/status`, {
    isActive
  })
  return response.data.data
}

export const duplicateSurvey = async (surveyId: string, newName: string): Promise<Survey> => {
  const response = await apiClient.post<ApiResponse<Survey>>(`/admin/surveys/${surveyId}/duplicate`, {
    name: newName
  })
  return response.data.data
}

// Survey Responses Management
export const getSurveyResponses = async (surveyId: string, params?: {
  limit?: number
  offset?: number
  status?: 'completed' | 'in_progress' | 'all'
}): Promise<{ responses: SurveyResponse[]; meta: PaginationMeta }> => {
  const response = await apiClient.get<ApiResponse<SurveyResponse[]>>(`/admin/surveys/${surveyId}/responses`, {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      status: params?.status || 'all'
    }
  })
  return {
    responses: response.data.data,
    meta: response.data.meta?.pagination || {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      total: response.data.data.length,
      hasMore: false
    }
  }
}

export const exportSurveyResponses = async (surveyId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
  const response = await apiClient.get(`/admin/surveys/${surveyId}/export`, {
    params: { format },
    responseType: 'blob'
  })
  return response.data
}

// Whitelist Management
export const getWhitelistEntries = async (surveyId: string, params?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<WhitelistManagementData> => {
  const response = await apiClient.get<ApiResponse<WhitelistEntry[]>>(`/admin/surveys/${surveyId}/whitelist`, {
    params: {
      limit: params?.limit || 50,
      offset: params?.offset || 0,
      search: params?.search
    }
  })
  return {
    surveyId,
    entries: response.data.data,
    totalEntries: response.data.meta?.pagination?.total || 0
  }
}

export const addWhitelistEntry = async (surveyId: string, walletAddress: string): Promise<WhitelistEntry> => {
  const response = await apiClient.post<ApiResponse<WhitelistEntry>>(`/admin/surveys/${surveyId}/whitelist`, {
    walletAddress
  })
  return response.data.data
}

export const bulkAddWhitelistEntries = async (request: BulkWhitelistRequest): Promise<WhitelistEntry[]> => {
  const response = await apiClient.post<ApiResponse<WhitelistEntry[]>>(
    `/admin/surveys/${request.surveyId}/whitelist/bulk`,
    { walletAddresses: request.walletAddresses }
  )
  return response.data.data
}

export const removeWhitelistEntry = async (surveyId: string, entryId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist/${entryId}`)
}

export const toggleWhitelistEntry = async (surveyId: string, entryId: string, isActive: boolean): Promise<WhitelistEntry> => {
  const response = await apiClient.patch<ApiResponse<WhitelistEntry>>(
    `/admin/surveys/${surveyId}/whitelist/${entryId}`,
    { isActive }
  )
  return response.data.data
}

export const clearWhitelist = async (surveyId: string): Promise<void> => {
  await apiClient.delete(`/admin/surveys/${surveyId}/whitelist`)
}

export const importWhitelistFromCSV = async (surveyId: string, file: File): Promise<WhitelistEntry[]> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post<ApiResponse<WhitelistEntry[]>>(
    `/admin/surveys/${surveyId}/whitelist/import`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return response.data.data
}

// User Management
export const getUsers = async (params?: {
  limit?: number
  offset?: number
  search?: string
  role?: 'all' | 'admin' | 'survey_creator' | 'respondent'
}): Promise<{ users: User[]; meta: PaginationMeta }> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/admin/users', {
    params: {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      search: params?.search,
      role: params?.role || 'all'
    }
  })
  return {
    users: response.data.data,
    meta: response.data.meta?.pagination || {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      total: response.data.data.length,
      hasMore: false
    }
  }
}

export const updateUserRole = async (userId: string, role: User['role']): Promise<User> => {
  const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, { role })
  return response.data.data
}

export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<User> => {
  const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/status`, { isActive })
  return response.data.data
}

export const adjustUserHerdPoints = async (userId: string, amount: number, reason: string): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>(`/admin/users/${userId}/herd-points/adjust`, {
    amount,
    reason
  })
  return response.data.data
}