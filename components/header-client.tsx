'use client'

import dynamic from 'next/dynamic'
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useUser, useIsAuthenticated } from "@/lib/store"
import { Settings } from "lucide-react"

// Dynamically import Web3 components to avoid SSR issues
const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => ({ default: mod.ConnectButton })),
  { ssr: false }
)

const AuthSection = dynamic(
  () => import('./auth/auth-section').then((mod) => ({ default: mod.AuthSection })),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-32 bg-zinc-100 rounded-lg animate-pulse"></div>
    )
  }
)

export function HeaderClient() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()

  // Only show admin panel for authenticated admin users
  const isAdmin = isAuthenticated && user?.role && ['survey_creator', 'admin'].includes(user.role)

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center h-40">
            <Link href="/surveys">
              <Image src="/logo.png" alt="Heard Labs" width={640} height={168} className="h-40 w-auto" />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin ? (
              <Link href="/admin">
                <Button variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-50">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-6 py-2 font-medium"
              >
                Create survey
              </Button>
            )}

            <AuthSection />
          </div>
        </div>
      </div>

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-zinc-900 mb-4">Create Survey Request</h3>
            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-zinc-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                  placeholder="Describe your survey requirements..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1 border-zinc-300 text-zinc-700 hover:bg-zinc-50 bg-transparent"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white">
                  Send Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
