"use client"

import { useEffect } from "react"
import { Button } from "./button"

interface CreateSurveyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateSurveyModal({ isOpen, onClose }: CreateSurveyModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 className="text-xl text-zinc-900 mb-4">Create Survey Request</h3>

        <p className="mb-4">The dashboard is currently in development. For now, please submit a survey request and we’ll get in touch with you</p>

        <p className="text-zinc-700">
          Email your survey brief to{' '}
          <a
            href="mailto:contact@heardlabs.xyz?subject=New%20survey%20request%20-%20%7Btopic%7D&body=Hi%20Heard%20Labs%2C%0A%0AI%27d%20like%20to%20run%20a%20survey.%0A%0A-%20Brief%3A%20what%20the%20project%2Fproduct%20is%20and%20why%20you%20need%20the%20survey.%0A-%20Survey%20idea%3A%20what%20you%20want%20to%20learn%20%2B%20draft%20questions%20or%20topics%20%28paste%20a%20few%29.%0A-%20Helpful%20extras%3A%20target%20audience2C%20links%2Fdocs."
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline font-medium"
            aria-label="Contact us via email"
          >
            contact@heardlabs.xyz
          </a>
        </p>
      </div>
    </div>
  )
}
