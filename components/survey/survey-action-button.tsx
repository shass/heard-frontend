"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface ButtonState {
  text: string
  disabled: boolean
  handler: () => void
}

interface SurveyActionButtonProps {
  buttonState: ButtonState
}

export function SurveyActionButton({ buttonState }: SurveyActionButtonProps) {
  return (
    <div className="flex justify-center pt-4">
      <Button
        onClick={buttonState.handler}
        disabled={buttonState.disabled}
        className={`px-8 py-3 ${buttonState.disabled ? 'bg-zinc-400 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
      >
        {buttonState.text}
        {buttonState.text === "Start Survey" && <ArrowRight className="w-4 h-4 ml-2" />}
      </Button>
    </div>
  )
}