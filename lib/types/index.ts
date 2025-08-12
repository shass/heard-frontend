// TypeScript types for the application

// User types (compatible with backend)
export interface User {
  id: string
  walletAddress: string
  role: 'respondent' | 'admin'
  heardPointsBalance: number
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

// Survey types (compatible with backend) 
export interface Survey {
  id: string
  name: string
  company: string
  description: string
  detailedDescription: string
  criteria: string
  rewardAmount: number
  rewardToken: string
  heardPointsReward: number
  totalQuestions: number
  responseCount: number
  isActive: boolean
  createdAt: string
}

// Question types
export interface Question {
  id: string
  questionText: string
  questionType: 'single' | 'multiple'
  order: number
  answers: Answer[]
  isRequired: boolean
}

export interface Answer {
  id: string
  text: string
  order: number
}

// Survey Response types
export interface SurveyResponse {
  id: string
  surveyId: string
  userId: string
  walletAddress: string
  responses: QuestionResponse[]
  completedAt?: string
  rewardIssued: boolean
  linkDropCode?: string
  heardPointsAwarded: number
  createdAt: string
}

export interface QuestionResponse {
  questionId: string
  selectedAnswers: string[]
}

// Extended interface for admin panel with full question and answer details
export interface AdminQuestionResponse {
  questionId: string
  questionText: string
  questionOrder: number
  selectedAnswers: Array<{
    id: string
    text: string
  }> | string[] // Support both formats for backward compatibility
}

// Admin survey response with enriched question and answer data
export interface AdminSurveyResponse extends Omit<SurveyResponse, 'responses'> {
  responses: AdminQuestionResponse[]
}

// HeardPoints Transaction types
export interface HeardPointsTransaction {
  id: string
  type: 'earned' | 'spent' | 'bonus' | 'admin_adjustment'
  amount: number
  description: string
  balanceBefore: number
  balanceAfter: number
  surveyId?: string
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  success: true
  data: T
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  meta: {
    timestamp: string
    requestId: string
  }
}

export interface PaginationMeta {
  limit: number
  offset: number
  total: number
  hasMore: boolean
}

// Authentication types
export interface AuthResponse {
  user: User
  token?: string // Optional for backward compatibility, HttpOnly cookie is preferred
  expiresAt: string
}

export interface NonceResponse {
  message: string
  jwtToken: string // JWT token containing nonce data
}

// Eligibility types
export interface EligibilityResponse {
  isEligible: boolean
  hasStarted: boolean
  hasCompleted: boolean
  reason?: string
}

// Reward types  
export interface RewardInfo {
  amount: number
  token: string
  linkDropCode: string
  claimUrl: string
}

// App state types
export interface AppState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface SurveyState {
  surveys: Survey[]
  currentSurvey: Survey | null
  currentResponse: SurveyResponse | null
  loading: boolean
  error: string | null
}

// Form types
export interface ConnectWalletRequest {
  walletAddress: string
  signature: string
  message: string
  jwtToken: string // JWT token from nonce response
}

export interface AnswerSubmissionRequest {
  responseId: string
  questionId: string
  selectedAnswers: string[]
}

// Utility types
export type ViewState = "home" | "survey" | "reward"

export type LoadingState = "idle" | "loading" | "success" | "error"

// Query state types
export interface QueryState<T> {
  data?: T
  loading: boolean
  error: string | null
  refetch: () => void
}

export interface MutationState {
  loading: boolean
  error: string | null
  success: boolean
}

export interface PaginatedQueryState<T> extends QueryState<T[]> {
  hasMore: boolean
  loadMore: () => void
  refreshing: boolean
}

// Loading component types
export interface LoadingComponentProps {
  loading?: boolean
  error?: string | null
  className?: string
  children?: React.ReactNode
}

export interface SkeletonProps {
  className?: string
  lines?: number
  width?: string | number
  height?: string | number
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Form state types
export interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  loading: boolean
  dirty: boolean
  valid: boolean
}

// Async operation state
export interface AsyncOperationState<T = any, E = string> {
  data?: T
  loading: boolean
  error?: E
  lastFetch?: Date
  stale: boolean
}

// Admin types
export interface AdminDashboardStats {
  totalSurveys: number
  activeSurveys: number
  totalResponses: number
  totalUsers: number
  monthlyResponses: number
  topSurveys: Array<{
    id: string
    name: string
    responseCount: number
    rewardAmount: number
    rewardToken: string
  }>
}

export interface CreateSurveyRequest {
  name: string
  company: string
  description: string
  detailedDescription: string
  criteria: string
  rewardAmount: number
  rewardToken: string
  heardPointsReward: number
  questions: CreateQuestionRequest[]
  whitelist?: string[]
}

export interface CreateQuestionRequest {
  questionText: string
  questionType: 'single' | 'multiple'
  order: number
  answers: CreateAnswerRequest[]
  isRequired: boolean
}

export interface CreateAnswerRequest {
  text: string
  order: number
}

export interface UpdateSurveyRequest extends Partial<CreateSurveyRequest> {
  id: string
  isActive?: boolean
}

// WhitelistEntry for paginated view with completion status
export interface WhitelistEntry {
  address: string
  hasCompleted: boolean
  completedAt: string | null
}

export interface WhitelistManagementData {
  surveyId: string
  entries: string[]  // For backward compatibility with simple view
  totalEntries: number
}

export interface WhitelistPagedData {
  addresses: WhitelistEntry[]
  pagination: {
    limit: number
    offset: number
    total: number
    filtered: number
    hasMore: boolean
  }
}

export interface BulkWhitelistRequest {
  surveyId: string
  walletAddresses: string[]
  replaceMode?: boolean
}

// Reward Links Types
export interface RewardLink {
  id: string
  claimLink: string
  createdAt: string
}

export interface UsedRewardLink extends RewardLink {
  usedBy: string
  usedAt: string
}

export interface RewardLinksData {
  unused: RewardLink[]
  used: UsedRewardLink[]
  stats: {
    total: number
    unused: number
    used: number
  }
}

// Removed single reward link addition - only bulk import supported

export interface ImportRewardLinksRequest {
  txtData: string
}

export interface AdminSurveyListItem extends Survey {
  whitelistCount: number
  whitelistCompleted: number
  whitelistPending: number
  rewardLinksTotal: number
  rewardLinksAvailable: number
  rewardLinksUsed: number
  eligibleUsers: number
  completionRate: number
  averageReward: number
}
