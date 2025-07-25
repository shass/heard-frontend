'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from "@/components/ui/button"
import { HeardPointsBalance } from "@/components/ui/heard-points-balance"
import { useAuthActions } from "@/components/providers/auth-provider"
import { useIsAuthenticated, useUser, useAuthLoading } from "@/lib/store"
import { useAccount, useDisconnect } from 'wagmi'
import { useNotifications } from "@/components/ui/notifications"
import { formatAddress } from "@/lib/web3"
import { Check, ArrowRight, Shield, Loader2, LogOut, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AuthSection() {
  const { login, logout } = useAuthActions()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const loading = useAuthLoading()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
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

  const handleLogout = async () => {
    try {
      await logout()
      disconnect() // Also disconnect the wallet
      notifications.success('Logged out', 'You have been successfully logged out')
    } catch (error: any) {
      console.error('AuthSection: Logout failed', error)
      notifications.error('Logout failed', error.message || 'Please try again')
    }
  }

  // Handle balance changes with notifications
  const handleBalanceChange = (newBalance: number, previousBalance: number) => {
    const difference = newBalance - previousBalance
    if (difference > 0) {
      notifications.success(
        'HeardPoints Earned!',
        `You earned ${difference} HeardPoints`,
        { duration: 3000 }
      )
    }
  }

  if (!isConnected) {
    return <ConnectButton />
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2 px-3 py-2 bg-zinc-50 border border-zinc-200">
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M22.46 12.65l-9.94-7.33c-.23-.17-.55-.17-.78 0L2.8 12.65c-.42.31-.42.85 0 1.16l9.94 7.33c.23.17.55.17.78 0l9.94-7.33c.42-.31-.42-.85 0-1.16z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-zinc-700">
                {formatAddress(user.walletAddress)}
              </span>
              <div className="h-4 w-px bg-zinc-300 mx-2"></div>
              <HeardPointsBalance
                onBalanceChange={handleBalanceChange}
                refreshInterval={30000}
                showLabel={true}
                clickable={false}
                className="!p-0 !cursor-default !hover:bg-transparent"
              />
              <ChevronDown className="w-4 h-4 text-zinc-500 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2 px-3 py-2">
            <div className="w-4 h-4 bg-zinc-500 rounded-full flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M22.46 12.65l-9.94-7.33c-.23-.17-.55-.17-.78 0L2.8 12.65c-.42.31-.42.85 0 1.16l9.94 7.33c.23.17.55.17.78 0l9.94-7.33c.42-.31-.42-.85 0-1.16z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-zinc-700">
              {address ? formatAddress(address) : 'Wallet'}
            </span>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => disconnect()} className="text-red-600 focus:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
