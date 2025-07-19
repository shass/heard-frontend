"use client"

import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-states"

interface SurveyErrorStateProps {
  title: string
  message: string
  onBack: () => void
}

function SurveyErrorState({ title, message, onBack }: SurveyErrorStateProps) {
  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">{title}</h2>
        <p className="text-zinc-600 mb-4">{message}</p>
        <Button onClick={onBack}>Back to surveys</Button>
      </div>
    </section>
  )
}

interface SurveyLoadingStateProps {
  message: string
}

function SurveyLoadingState({ message }: SurveyLoadingStateProps) {
  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <LoadingState loading={true}>
          <div>{message}</div>
        </LoadingState>
      </div>
    </section>
  )
}

function AuthRequiredState({ onBack }: { onBack: () => void }) {
  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">Authentication Required</h2>
        <p className="text-zinc-600">Please connect your wallet to take this survey.</p>
        <Button onClick={onBack} className="mt-4">Back to surveys</Button>
      </div>
    </section>
  )
}

export {
  SurveyErrorState,
  SurveyLoadingState,
  AuthRequiredState
}