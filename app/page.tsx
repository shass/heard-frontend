"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SurveyTable } from "@/components/survey-table"
import { SurveyPageWithSuspense, RewardPageWithSuspense } from "@/components/lazy"
import { Footer } from "@/components/footer"
import type { ViewState, Survey } from "@/lib/types"

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>("home")
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [responseId, setResponseId] = useState<string | null>(null)

  const handleTakeSurvey = (survey: Survey) => {
    setSelectedSurvey(survey)
    setCurrentView("survey")
  }

  const handleSubmitSurvey = (submittedResponseId?: string) => {
    if (submittedResponseId) {
      setResponseId(submittedResponseId)
    }
    setCurrentView("reward")
  }

  const handleBackToSurveys = () => {
    setCurrentView("home")
    setSelectedSurvey(null)
    setResponseId(null)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        {currentView === "home" && (
          <>
            <HeroSection />
            <SurveyTable onTakeSurvey={handleTakeSurvey} />
          </>
        )}

        {currentView === "survey" && selectedSurvey && (
          <SurveyPageWithSuspense survey={selectedSurvey} onSubmit={handleSubmitSurvey} onBack={handleBackToSurveys} />
        )}

        {currentView === "reward" && selectedSurvey && (
          <RewardPageWithSuspense survey={selectedSurvey} onBackToSurveys={handleBackToSurveys} responseId={responseId} />
        )}
      </main>

      <Footer />
    </div>
  )
}
