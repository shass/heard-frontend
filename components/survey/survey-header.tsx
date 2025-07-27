"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InlineLoading } from "@/components/ui/loading-states"
import { ArrowLeft, Save } from "lucide-react"
import type { Survey } from "@/lib/types"

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SurveyHeaderProps {
  survey: Survey
  saveStatus?: SaveStatus
  onBack: () => void
  variant?: 'default' | 'info' // 'info' for survey info page
}

export function SurveyHeader({ survey, saveStatus, onBack, variant = 'default' }: SurveyHeaderProps) {
  if (variant === 'info') {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Surveys
        </Button>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-zinc-900">{survey.name}</h1>
            </div>
            <Badge variant={survey.isActive ? "default" : "secondary"}>
              {survey.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <p className="text-lg text-zinc-700">{survey.description}</p>
        </div>
      </div>
    )
  }

  // Default variant for survey taking
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
