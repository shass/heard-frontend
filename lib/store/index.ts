// Global store using Zustand

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User, Survey, SurveyResponse, Notification } from '@/lib/types'
import { apiClient } from '@/lib/api/client'

// Auth store
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  initialized: boolean // Flag to prevent duplicate auth checks from WebAuthInitializer

  // Granular setters
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setInitialized: (initialized: boolean) => void

  // Composite actions
  startAuth: () => void
  authSuccess: (user: User) => void
  authFailure: (error: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true, // Start with loading true to prevent flickering
      error: null,
      initialized: false,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error, loading: false }),

      setInitialized: (initialized) => set({ initialized }),

      // Composite actions
      startAuth: () => set({ loading: true, error: null }),

      authSuccess: (user) => set({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
      }),

      authFailure: (error) => set({ error, loading: false }),

      logout: () => {
        // Clear auth state
        set({
          user: null,
          isAuthenticated: false,
          loading: false, // Not loading after explicit logout
          error: null,
          initialized: false, // Reset initialized flag so auth check runs again
        })

        // Clear token from storage (localStorage for Base App, no-op for Web)
        apiClient.clearAuthToken()

        // Clear all survey state as well
        const { clearAll } = useSurveyStore.getState()
        clearAll()
      },
    }),
    { name: 'auth-store' }
  )
)

// Optimized selectors for frequently used data
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useUser = () => useAuthStore(state => state.user)
export const useAuthLoading = () => useAuthStore(state => state.loading)
export const useAuthError = () => useAuthStore(state => state.error)

// Survey store
interface SurveyStore {
  surveys: Survey[]
  currentSurvey: Survey | null
  currentResponse: SurveyResponse | null
  loading: boolean
  error: string | null

  // Actions
  setSurveys: (surveys: Survey[]) => void
  setCurrentSurvey: (survey: Survey | null) => void
  setCurrentResponse: (response: SurveyResponse | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearCurrent: () => void
  clearAll: () => void
}

export const useSurveyStore = create<SurveyStore>()(
  devtools(
    (set) => ({
      surveys: [],
      currentSurvey: null,
      currentResponse: null,
      loading: false,
      error: null,

      setSurveys: (surveys) => set({ surveys, error: null }),

      setCurrentSurvey: (currentSurvey) => set({ currentSurvey }),

      setCurrentResponse: (currentResponse) => set({ currentResponse }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error, loading: false }),

      clearCurrent: () => set({
        currentSurvey: null,
        currentResponse: null,
        error: null,
      }),

      clearAll: () => set({
        surveys: [],
        currentSurvey: null,
        currentResponse: null,
        loading: false,
        error: null,
      }),
    }),
    { name: 'survey-store' }
  )
)

// App-wide UI store
interface UIStore {
  theme: 'light' | 'dark' | 'system'
  notifications: Notification[]

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      theme: 'system',
      notifications: [],

      setTheme: (theme) => set({ theme }),

      addNotification: (notification) => {
        const id = crypto.randomUUID()
        const newNotification = { ...notification, id }

        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))
        // Auto-dismiss is handled by the NotificationItem component's useEffect timer
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
    }),
    { name: 'ui-store' }
  )
)
