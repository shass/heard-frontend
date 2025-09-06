import { env } from '@/lib/env'

export const API_CONFIG = {
  baseURL: env.API_URL,
  timeout: env.API_TIMEOUT,
  endpoints: {
    auth: {
      nonce: '/auth/nonce',
      connectWallet: '/auth/connect-wallet',
      logout: '/auth/logout'
    },
    surveys: {
      list: '/surveys',
      byId: (id: string) => `/surveys/${id}`,
      eligibility: (id: string) => `/surveys/${id}/eligibility`,
      responses: (id: string) => `/surveys/${id}/responses`,
      stats: (id: string) => `/surveys/${id}/stats`
    },
    admin: {
      dashboard: '/admin/dashboard',
      surveys: '/admin/surveys',
      users: '/admin/users',
      whitelist: '/admin/whitelist'
    }
  }
} as const