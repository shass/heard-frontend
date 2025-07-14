"use client"

import { Button } from "@/components/ui/button"
import type { Survey } from "@/app/page"

interface RewardPageProps {
  survey: Survey
  onBackToSurveys: () => void
}

export function RewardPage({ survey, onBackToSurveys }: RewardPageProps) {
  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Survey Completed!</h2>
            <p className="text-base text-zinc-600">
              Thank you for completing the {survey.name}. Your reward of {survey.reward} is ready to claim.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-45 h-45 bg-zinc-100 rounded-lg flex items-center justify-center">
              <img src="/placeholder.svg?height=180&width=180" alt="QR Code for reward claim" className="w-45 h-45" />
            </div>
          </div>

          <div className="space-y-4">
            <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg py-3 text-base font-medium">
              Claim Reward
            </Button>

            <Button
              onClick={onBackToSurveys}
              variant="outline"
              className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg py-3 text-base font-medium bg-transparent"
            >
              Back to Surveys
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
