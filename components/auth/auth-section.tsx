'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from "@/components/ui/button"
import { HerdPointsBalance } from "@/components/ui/herd-points-balance"
import { useAuthActions } from "@/components/providers/auth-provider"
import { useIsAuthenticated, useUser, useAuthLoading } from "@/lib/store"
import { useAccount } from 'wagmi'
import { useNotifications } from "@/components/ui/notifications"
import { formatAddress } from "@/lib/web3"
import { Check, ArrowRight, Shield, Loader2 } from 'lucide-react'

export function AuthSection() {
  const { login } = useAuthActions()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const loading = useAuthLoading()
  const { isConnected } = useAccount()
  const notifications = useNotifications()
  
  const handleLogin = async () => {
    try {
      console.log('AuthSection: Starting login process')
      await login()
      console.log('AuthSection: Login successful')
      notifications.success('Authentication successful', 'You can now take surveys')
    } catch (error: any) {
      console.error('AuthSection: Login failed', error)
      notifications.error(
        'Authentication failed',
        error.message || 'Please try again or contact support'
      )
    }
  }
  
  // Handle balance changes with notifications
  const handleBalanceChange = (newBalance: number, previousBalance: number) => {
    const difference = newBalance - previousBalance
    if (difference > 0) {
      notifications.success(
        'HerdPoints Earned!',
        `You earned ${difference} HerdPoints`,
        { duration: 3000 }
      )
    }
  }

  if (!isConnected) {
    return <ConnectButton />
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3 bg-zinc-50 rounded-lg px-4 py-2 border border-zinc-200">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M22.46 12.65l-9.94-7.33c-.23-.17-.55-.17-.78 0L2.8 12.65c-.42.31-.42.85 0 1.16l9.94 7.33c.23.17.55.17.78 0l9.94-7.33c.42-.31-.42-.85 0-1.16z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-zinc-700">
            {formatAddress(user.walletAddress)}
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-300"></div>
        <HerdPointsBalance 
          onBalanceChange={handleBalanceChange}
          refreshInterval={30000}
          showLabel={true}
        />
        <ConnectButton 
          showBalance={false}
          accountStatus="address"
          chainStatus="none"
        />
      </div>
    )
  }

  // Connected but not authenticated
  return (
    <div className="flex items-center space-x-3">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2 bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-200">
        <div className="flex items-center space-x-1">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm text-zinc-700">Wallet Connected</span>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400" />
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-zinc-500">Authenticate</span>
        </div>
      </div>
      
      <Button
        onClick={handleLogin}
        disabled={loading}
        className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 font-medium"
        title="Sign a message to prove wallet ownership (free, no gas)"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Sign Message
          </>
        )}
      </Button>
      
      <ConnectButton 
        showBalance={false}
        accountStatus="address"
        chainStatus="none"
      />
    </div>
  )
}