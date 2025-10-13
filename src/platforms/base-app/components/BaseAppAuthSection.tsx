'use client'

import { Button } from "@/components/ui/button"
import { HeardPointsBalance } from "@/components/ui/heard-points-balance"
import { useAuth } from "@/src/platforms/_core/hooks/useAuth"
import { useNotifications } from "@/components/ui/notifications"
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatAddress } from '@/lib/utils'

export function BaseAppAuthSection() {
  const auth = useAuth()
  const notifications = useNotifications()

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

  // In Base App, user is always authenticated via context
  if (auth.user) {
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
                {auth.user.walletAddress
                  ? formatAddress(auth.user.walletAddress)
                  : '@' + ((auth.user.metadata as any)?.username || `FID ${auth.user.id}`)}
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
            <DropdownMenuItem disabled className="text-zinc-500">
              FID: {auth.user.id}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Show loading state while context loads
  return (
    <div className="flex items-center space-x-2">
      <div className="h-8 w-32 bg-zinc-100 rounded-lg animate-pulse"></div>
    </div>
  )
}
