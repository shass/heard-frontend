"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { Survey } from "@/app/page"

interface SurveyPageProps {
  survey: Survey
  onSubmit: () => void
  onBack: () => void
}

const surveyQuestions = [
  {
    id: 1,
    question: "How often do you use DeFi protocols?",
    options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
  },
  {
    id: 2,
    question: "What is your primary reason for using Web3 applications?",
    options: ["Investment/Trading", "Gaming", "Social/Community", "Development", "Other"],
  },
  {
    id: 3,
    question: "Which blockchain do you use most frequently?",
    options: ["Ethereum", "Polygon", "Binance Smart Chain", "Solana", "Other"],
  },
]

export function SurveyPage({ survey, onSubmit, onBack }: SurveyPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const currentQuestion = surveyQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      onSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const canProceed = answers[currentQuestion.id] !== undefined
  const isLastQuestion = currentQuestionIndex === surveyQuestions.length - 1

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 p-0 h-auto font-normal text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to surveys
          </Button>
          <h2 className="text-xl font-semibold text-zinc-900">{survey.name}</h2>
          <p className="text-base text-zinc-600 mt-1">{survey.company}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-zinc-600 mb-2">
            <span>
              Question {currentQuestionIndex + 1} of {surveyQuestions.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div
              className="bg-zinc-900 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-zinc-900">{currentQuestion.question}</h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                />
                <span className="text-base text-zinc-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center space-x-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white"
          >
            <span>{isLastQuestion ? "Submit Survey" : "Next"}</span>
            {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </section>
  )
}
