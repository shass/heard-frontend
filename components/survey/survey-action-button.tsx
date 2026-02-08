"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"
import type { ButtonState, SurveyButtonPhase } from "@/lib/survey/button-state-machine"

interface SurveyActionButtonProps {
  buttonState: ButtonState
  phase: SurveyButtonPhase
}

export function SurveyActionButton({ buttonState, phase }: SurveyActionButtonProps) {
  const showArrow = (phase === 'start' || phase === 'continue') && !buttonState.loading

  return (
    <div className="flex justify-center pt-4">
      <Button
        onClick={buttonState.handler}
        disabled={buttonState.disabled}
        className={`px-8 py-3 ${buttonState.disabled ? 'bg-zinc-400 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
      >
        {buttonState.loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {buttonState.text}
        {showArrow && <ArrowRight className="w-4 h-4 ml-2" />}
      </Button>
    </div>
  )
}