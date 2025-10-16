// Global store using Zustand

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User, Survey, SurveyResponse } from '@/lib/types'

// Auth store
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  isLoading: boolean // Alias for compatibility
  error: string | null
  initialized: boolean // Flag to prevent duplicate auth checks

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setInitialized: (initialized: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true, // Start with loading true to prevent flickering
      isLoading: true, // Alias for compatibility
      error: null,
      initialized: false,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),

      setLoading: (loading) => set({ loading, isLoading: loading }),

      setError: (error) => set({ error, loading: false, isLoading: false }),

      setInitialized: (initialized) => set({ initialized }),

      logout: () => {
        // Clear auth state
        set({
          user: null,
          isAuthenticated: false,
          loading: false, // Not loading after explicit logout
          isLoading: false,
          error: null,
          initialized: false, // Reset initialized flag so auth check runs again
        })

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
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: Notification[]

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      sidebarOpen: false,
      theme: 'system',
      notifications: [],

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setTheme: (theme) => set({ theme }),

      addNotification: (notification) => {
        const id = Math.random().toString(36).slice(2)
        const newNotification = { ...notification, id }

        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))

        // Auto-remove after duration (default 5s)
        const duration = notification.duration || 5000
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            get().removeNotification(id)
          }, duration)
        }
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
    }),
    { name: 'ui-store' }
  )
)
