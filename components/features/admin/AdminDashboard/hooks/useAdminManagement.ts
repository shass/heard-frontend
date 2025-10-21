'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUserRole } from '@/lib/api/admin'
import { useNotifications } from '@/components/ui/notifications'
import type { User } from '@/lib/types'
import { isAddress } from 'viem'

export function useAdminManagement() {
  const [newAdminAddress, setNewAdminAddress] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [adminToRemove, setAdminToRemove] = useState<User | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const notifications = useNotifications()

  // Fetch all admin users
  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getUsers({ role: 'admin', limit: 100 })
  })

  const admins = adminsData?.users || []

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      // First, check if user exists by fetching all users with this wallet
      const searchResult = await getUsers({ search: walletAddress, limit: 1 })

      if (searchResult.users.length === 0) {
        throw new Error('User not found. The wallet address must be registered in the system.')
      }

      const user = searchResult.users[0]

      if (user.role === 'admin') {
        throw new Error('This wallet is already an admin.')
      }

      // Update user role to admin
      return updateUserRole(user.id, 'admin')
    },
    onSuccess: () => {
      notifications.success(
        'Admin added',
        'Wallet address has been granted admin privileges'
      )
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsAddDialogOpen(false)
      setNewAdminAddress('')
    },
    onError: (error: any) => {
      notifications.error(
        'Failed to add admin',
        error?.message || 'An error occurred while adding admin'
      )
    }
  })

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return updateUserRole(userId, 'respondent')
    },
    onSuccess: () => {
      notifications.success(
        'Admin removed',
        'Admin privileges have been revoked'
      )
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsRemoveDialogOpen(false)
      setAdminToRemove(null)
    },
    onError: (error: any) => {
      notifications.error(
        'Failed to remove admin',
        error?.message || 'An error occurred while removing admin'
      )
    }
  })

  const handleAddAdmin = () => {
    const trimmedAddress = newAdminAddress.trim()

    if (!trimmedAddress) {
      notifications.error('Invalid address', 'Please enter a wallet address')
      return
    }

    if (!isAddress(trimmedAddress)) {
      notifications.error('Invalid address', 'Please enter a valid Ethereum wallet address')
      return
    }

    addAdminMutation.mutate(trimmedAddress)
  }

  const handleRemoveClick = (admin: User) => {
    setAdminToRemove(admin)
    setIsRemoveDialogOpen(true)
  }

  const handleConfirmRemove = () => {
    if (adminToRemove) {
      removeAdminMutation.mutate(adminToRemove.id)
    }
  }

  const handleCancelRemove = () => {
    setIsRemoveDialogOpen(false)
    setAdminToRemove(null)
  }

  return {
    // State
    admins,
    isLoading,
    newAdminAddress,
    setNewAdminAddress,
    isAddDialogOpen,
    setIsAddDialogOpen,
    adminToRemove,
    isRemoveDialogOpen,

    // Mutations
    isAdding: addAdminMutation.isPending,
    isRemoving: removeAdminMutation.isPending,

    // Handlers
    handleAddAdmin,
    handleRemoveClick,
    handleConfirmRemove,
    handleCancelRemove
  }
}
