"use client"

import { Button } from "@/components/ui/button"
import { InlineLoading } from "@/components/ui/loading-states"
import { ArrowLeft, Save } from "lucide-react"
import type { Survey } from "@/lib/types"

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SurveyHeaderProps {
  survey: Survey
  saveStatus: SaveStatus
  onBack: () => void
}

export function SurveyHeader({ survey, saveStatus, onBack }: SurveyHeaderProps) {
  return (
    <div className="mb-8">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-4 p-0 h-auto font-normal text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to surveys
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">{survey.name}</h2>
          <p className="text-base text-zinc-600 mt-1">{survey.company}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          {saveStatus === 'saving' && (
            <div className="flex items-center text-zinc-600">
              <InlineLoading className="mr-1" />
              Saving...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center text-green-600">
              <Save className="w-4 h-4 mr-1" />
              Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="text-red-600">Save failed</div>
          )}
        </div>
      </div>
    </div>
  )
}
