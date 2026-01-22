'use client'

import dynamic from 'next/dynamic'
import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "./ui/button"
import { useUser, useIsAuthenticated, useAuthLoading } from "@/lib/store"
import { useCreateSurveyModal } from "@/hooks/use-create-survey-modal"
import { Settings } from "lucide-react"

// Dynamically import AuthSection to avoid SSR issues
const AuthSection = dynamic(
  () => import('@/src/core/components/PlatformAuthSection').then((mod) => ({
    default: mod.PlatformAuthSection
  })),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-32 bg-zinc-100 rounded-lg animate-pulse"></div>
    )
  }
)

interface HeaderClientProps {
  onCreateSurvey?: () => void
}

export function HeaderClient({ onCreateSurvey }: HeaderClientProps) {
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const isAuthLoading = useAuthLoading()
  const { openModal } = useCreateSurveyModal()
  const isAuthenticatedAdmin = !isAuthLoading && isAuthenticated && user?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center h-10">
            <Link href="/">
              {/* Full logo on desktop, icon on mobile */}
              <Image
                src="/logo.svg"
                alt="Heard Labs"
                width={160}
                height={160}
                className="hidden sm:block h-10 w-40 min-w-40"
              />
              <Image
                src="/icon-200x200.png"
                alt="Heard"
                width={40}
                height={40}
                className="block sm:hidden h-10 w-10 min-w-10"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticatedAdmin && (
              <Link href="/admin">
                <Button variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-50">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}

            <Button
              onClick={() => {
                if (onCreateSurvey) {
                  onCreateSurvey()
                } else {
                  openModal()
                }
              }}
              className="hidden sm:flex bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-6 py-2 font-medium"
            >
              Create survey
            </Button>

            <AuthSection />
          </div>
        </div>
      </div>

    </header>
  )
}
