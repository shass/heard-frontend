"use client"

import { Button } from "@/components/ui/button"

interface CreateSurveyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateSurveyModal({ isOpen, onClose }: CreateSurveyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 className="text-xl font-semibold text-zinc-900 mb-4">Create Survey Request</h3>

        <p className="mb-4">The dashboard is currently in development. For now, please submit a survey request and we’ll get in touch with you</p>

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
              onClick={onClose}
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
  )
}
