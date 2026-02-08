import { resolveAdminAuthPhase, AdminAuthInput } from '../admin-auth-state-machine'

const defaultInput: AdminAuthInput = {
  initialized: true,
  loading: false,
  isConnected: true,
  isAuthenticated: true,
  isCreatingSession: false,
  user: { role: 'admin', walletAddress: '0xABC123' },
  connectedAddress: '0xABC123',
}

function input(overrides: Partial<AdminAuthInput>): AdminAuthInput {
  return { ...defaultInput, ...overrides }
}

describe('resolveAdminAuthPhase', () => {
  // --- Phase resolution ---

  it('returns initializing when store not initialized', () => {
    expect(resolveAdminAuthPhase(input({ initialized: false }))).toBe('initializing')
  })

  it('returns initializing when store is loading', () => {
    expect(resolveAdminAuthPhase(input({ loading: true }))).toBe('initializing')
  })

  it('returns initializing when authenticated but user not loaded', () => {
    expect(resolveAdminAuthPhase(input({ user: null }))).toBe('initializing')
  })

  it('returns connect_wallet when wallet not connected', () => {
    expect(resolveAdminAuthPhase(input({ isConnected: false }))).toBe('connect_wallet')
  })

  it('returns authenticate when connected but not authenticated', () => {
    expect(resolveAdminAuthPhase(input({ isAuthenticated: false }))).toBe('authenticate')
  })

  it('returns authenticating when session creation in progress', () => {
    expect(
      resolveAdminAuthPhase(input({ isAuthenticated: false, isCreatingSession: true })),
    ).toBe('authenticating')
  })

  it('returns wallet_mismatch when wallets differ', () => {
    expect(
      resolveAdminAuthPhase(input({ connectedAddress: '0xDIFFERENT' })),
    ).toBe('wallet_mismatch')
  })

  it('returns wallet_mismatch case-insensitively', () => {
    expect(
      resolveAdminAuthPhase(
        input({
          user: { role: 'admin', walletAddress: '0xabc123' },
          connectedAddress: '0xABC123',
        }),
      ),
    ).toBe('authorized')
  })

  it('returns access_denied when user is not admin', () => {
    expect(
      resolveAdminAuthPhase(input({ user: { role: 'respondent', walletAddress: '0xABC123' } })),
    ).toBe('access_denied')
  })

  it('returns authorized when all checks pass', () => {
    expect(resolveAdminAuthPhase(defaultInput)).toBe('authorized')
  })

  // --- Priority ordering ---

  it('connect_wallet takes priority over initializing', () => {
    expect(
      resolveAdminAuthPhase(input({ initialized: false, isConnected: false })),
    ).toBe('connect_wallet')
  })

  it('connect_wallet takes priority over authenticate', () => {
    expect(
      resolveAdminAuthPhase(input({ isConnected: false, isAuthenticated: false })),
    ).toBe('connect_wallet')
  })

  it('authenticating takes priority over authenticate', () => {
    expect(
      resolveAdminAuthPhase(input({ isAuthenticated: false, isCreatingSession: true })),
    ).toBe('authenticating')
  })

  it('wallet_mismatch takes priority over access_denied', () => {
    expect(
      resolveAdminAuthPhase(
        input({
          user: { role: 'respondent', walletAddress: '0xOTHER' },
          connectedAddress: '0xABC123',
        }),
      ),
    ).toBe('wallet_mismatch')
  })

  it('connect_wallet takes priority over loading when wallet not connected', () => {
    expect(
      resolveAdminAuthPhase(
        input({
          loading: true,
          isConnected: false,
          isAuthenticated: false,
          user: null,
        }),
      ),
    ).toBe('connect_wallet')
  })

  it('loading takes priority when wallet IS connected', () => {
    expect(
      resolveAdminAuthPhase(
        input({
          loading: true,
          isConnected: true,
          isAuthenticated: false,
          user: null,
        }),
      ),
    ).toBe('initializing')
  })
})
