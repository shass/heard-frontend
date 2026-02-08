/**
 * Admin auth phases — finite state machine.
 * Priority-ordered: higher in the list = checked first.
 */
export type AdminAuthPhase =
  | 'initializing'
  | 'connect_wallet'
  | 'authenticate'
  | 'authenticating'
  | 'auth_failed'
  | 'wallet_mismatch'
  | 'access_denied'
  | 'authorized'

export interface AdminAuthInput {
  initialized: boolean
  loading: boolean
  isConnected: boolean
  isAuthenticated: boolean
  isCreatingSession: boolean
  authAttemptFailed: boolean
  user: { role: string; walletAddress?: string } | null
  connectedAddress?: string
}

/**
 * Resolve the current admin auth phase from all input signals.
 * Pure function — no side effects, easily testable.
 */
export function resolveAdminAuthPhase(input: AdminAuthInput): AdminAuthPhase {
  // 1. No wallet connected — no need to wait for auth store initialization
  //    (store won't initialize without wallet because checkAuthStatus requires canAuthenticate)
  if (!input.isConnected) return 'connect_wallet'

  // 2. Session creation in progress — takes priority over store loading
  //    (authenticate() calls startAuth() which sets store.loading=true, must not flicker to 'initializing')
  if (input.isCreatingSession) return 'authenticating'

  // 3. Store not initialized or loading (wallet IS connected, waiting for checkAuthStatus)
  if (!input.initialized || input.loading) return 'initializing'

  // 4. Auth attempt failed (user rejected signature or error) — show retry
  if (!input.isAuthenticated && input.authAttemptFailed) return 'auth_failed'

  // 5. Wallet connected but not authenticated — triggers auto-auth
  if (!input.isAuthenticated) return 'authenticate'

  // 6. Authenticated but user not loaded yet (edge case)
  if (!input.user) return 'initializing'

  // 7. Wallet mismatch — authenticated user's wallet differs from connected wallet
  if (input.user.walletAddress?.toLowerCase() !== input.connectedAddress?.toLowerCase()) {
    return 'wallet_mismatch'
  }

  // 8. Not an admin
  if (input.user.role !== 'admin') return 'access_denied'

  // 9. All checks passed
  return 'authorized'
}
