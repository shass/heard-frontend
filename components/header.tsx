"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Header() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center h-40">
            <Image src="/logo.png" alt="Heard Labs" width={640} height={168} className="h-40 w-auto" />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-6 py-2 font-medium"
            >
              Create survey
            </Button>

            <div className="flex items-center space-x-3 bg-zinc-50 rounded-lg px-4 py-2 border border-zinc-200">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M22.46 12.65l-9.94-7.33c-.23-.17-.55-.17-.78 0L2.8 12.65c-.42.31-.42.85 0 1.16l9.94 7.33c.23.17.55.17.78 0l9.94-7.33c.42-.31-.42-.85 0-1.16z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-700">0x1234...5678</span>
              </div>
              <div className="h-4 w-px bg-zinc-300"></div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-zinc-900">1,000</span>
                <span className="text-sm text-zinc-600">HEARD</span>
              </div>
            </div>
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
