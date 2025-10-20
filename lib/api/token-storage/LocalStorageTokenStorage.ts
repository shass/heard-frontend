import { ITokenStorage } from './ITokenStorage'

/**
 * LocalStorage-based token storage for Base App platform
 *
 * Base App requires client-side token storage because it runs in a mini-app
 * environment where HttpOnly cookies may not be available.
 *
 * Security note: localStorage is less secure than HttpOnly cookies,
 * but it's the only option for Base App environment.
 */
export class LocalStorageTokenStorage implements ITokenStorage {
  private readonly STORAGE_KEY = 'auth_token'

  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      return localStorage.getItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('[LocalStorageTokenStorage] Failed to get token:', error)
      return null
    }
  }

  setToken(token: string | null): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      if (token) {
        localStorage.setItem(this.STORAGE_KEY, token)
        console.log('[LocalStorageTokenStorage] Token stored')
      } else {
        this.clearToken()
      }
    } catch (error) {
      console.error('[LocalStorageTokenStorage] Failed to set token:', error)
    }
  }

  clearToken(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('[LocalStorageTokenStorage] Token cleared')
    } catch (error) {
      console.error('[LocalStorageTokenStorage] Failed to clear token:', error)
    }
  }
}
