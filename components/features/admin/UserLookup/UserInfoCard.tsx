'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Star, Calendar, Clock } from 'lucide-react'
import type { WalletLookupUser, WalletLookupStats } from '@/lib/types'

interface UserInfoCardProps {
  user: WalletLookupUser | null
  stats: WalletLookupStats
}

export function UserInfoCard({ user, stats }: UserInfoCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            User Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No user account found for this wallet address, but survey responses may exist.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          User Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Wallet Address</p>
            <p className="font-mono text-sm break-all">{user.walletAddress}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Star className="w-4 h-4" />
            HeardPoints Balance
          </p>
          <p className="text-2xl font-bold">{user.heardPointsBalance.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Registered
            </p>
            <p className="text-sm">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last Login
            </p>
            <p className="text-sm">{formatDate(user.lastLoginAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalSurveys}</p>
            <p className="text-xs text-muted-foreground">Total Surveys</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completedSurveys}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgressSurveys}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
