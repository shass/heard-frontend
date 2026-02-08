/**
 * Admin auth phases — finite state machine.
 * Priority-ordered: higher in the list = checked first.
 */
export type AdminAuthPhase =
  | 'initializing'
  | 'connect_wallet'
  | 'authenticate'
  | 'authenticating'
  | 'wallet_mismatch'
  | 'access_denied'
  | 'authorized'

export interface AdminAuthInput {
  initialized: boolean
  loading: boolean
  isConnected: boolean
  isAuthenticated: boolean
  isCreatingSession: boolean
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

  // 2. Store not initialized or loading (wallet IS connected, waiting for checkAuthStatus)
  if (!input.initialized || input.loading) return 'initializing'

  // 3. Session creation in progress
  if (!input.isAuthenticated && input.isCreatingSession) return 'authenticating'

  // 4. Wallet connected but not authenticated
  if (!input.isAuthenticated) return 'authenticate'

  // 5. Authenticated but user not loaded yet (edge case)
  if (!input.user) return 'initializing'

  // 6. Wallet mismatch — authenticated user's wallet differs from connected wallet
  if (input.user.walletAddress?.toLowerCase() !== input.connectedAddress?.toLowerCase()) {
    return 'wallet_mismatch'
  }

  // 7. Not an admin
  if (input.user.role !== 'admin') return 'access_denied'

  // 8. All checks passed
  return 'authorized'
}
