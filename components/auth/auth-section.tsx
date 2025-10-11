'use client'

import { Button } from "@/components/ui/button"
import { HeardPointsBalance } from "@/components/ui/heard-points-balance"
import { useAuthActions } from "@/components/providers/auth-provider"
import { useNotifications } from "@/components/ui/notifications"
import { LogOut, ChevronDown, Wallet } from 'lucide-react'
import { useCompatibleWallet, PlatformSwitch, usePlatformDetector } from '@/src/platforms'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FarcasterAuthButton } from "@/components/farcaster-auth-button"
import { formatAddress } from '@/lib/utils'
import { Platform } from '@/src/platforms/config'

// Dynamic import for RainbowKit to avoid loading in non-Web platforms
const useWebConnectModal = () => {
  const { platform } = usePlatformDetector()

  if (platform === Platform.WEB) {
    // Only import and use RainbowKit in Web platform
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useConnectModal } = require('@rainbow-me/rainbowkit')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useConnectModal()
  }

  return { openConnectModal: undefined }
}

export function AuthSection() {
  const { logout, isAuthenticated, user, isLoading } = useAuthActions()
  const notifications = useNotifications()
  const { openConnectModal } = useWebConnectModal()

  // Use compatible wallet hook for platform-aware functionality
  const compatibleWallet = useCompatibleWallet()
  const isConnected = compatibleWallet?.isConnected || false
  const address = compatibleWallet?.address || null

  const handleLogout = async () => {
    try {
      await logout();
      await compatibleWallet.disconnect(); // Use platform-aware disconnect
      notifications.success('Logged out', 'You have been successfully logged out')
    } catch (error: any) {
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

  if (!isConnected && !compatibleWallet.isConnected) {
    const handleConnect = async () => {
      try {
        if (compatibleWallet.connect) {
          await compatibleWallet.connect()
          notifications.success('Wallet Connected', 'Your wallet has been connected successfully')
        } else if (openConnectModal) {
          // Fallback to RainbowKit modal for web platform
          openConnectModal()
        } else {
          notifications.error('Connection failed', 'No connection method available')
        }
      } catch (error: any) {
        // Additional fallback to RainbowKit modal for web platform
        if (openConnectModal) {
          openConnectModal()
        } else {
          notifications.error('Connection failed', error.message || 'Please try again')
        }
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <PlatformSwitch
          web={
            <div className="flex items-center space-x-2">
              <FarcasterAuthButton
                variant="ghost"
                size="sm"
                onSuccess={(result) => {
                  console.log('Farcaster auth success:', result);
                }}
              />
              <Button
                onClick={() => openConnectModal?.()}
                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-4 py-2 font-medium flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </Button>
            </div>
          }
          baseApp={
            <Button
              onClick={handleConnect}
              disabled={compatibleWallet.isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>{compatibleWallet.isConnecting ? 'Connecting...' : 'Connect Base'}</span>
            </Button>
          }
          farcaster={
            <Button
              onClick={handleConnect}
              disabled={compatibleWallet.isConnecting}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-medium flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>{compatibleWallet.isConnecting ? 'Connecting...' : 'Quick Connect'}</span>
            </Button>
          }
        />
      </div>
    )
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

  // Connected but not authenticated - show wallet dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2 px-3 py-2">
          <div className="w-4 h-4 bg-zinc-500 rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M22.46 12.65l-9.94-7.33c-.23-.17-.55-.17-.78 0L2.8 12.65c-.42.31-.42.85 0 1.16l9.94 7.33c.23.17.55.17.78 0l9.94-7.33c.42-.31-.42-.85 0-1.16z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-zinc-700">
            {isLoading ? 'Signing...' : (address ? formatAddress(address) : 'Wallet')}
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
