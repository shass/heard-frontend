"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SurveyTable } from "@/components/survey-table"
import { SurveyPage } from "@/components/survey-page"
import { RewardPage } from "@/components/reward-page"
import { Footer } from "@/components/footer"

export type ViewState = "home" | "survey" | "reward"

export interface Survey {
  id: string
  name: string
  company: string
  reward: string
}

const mockSurveys: Survey[] = [
  { id: "1", name: "DeFi User Experience Survey", company: "Uniswap Labs", reward: "50 USDC" },
  { id: "2", name: "NFT Marketplace Feedback", company: "OpenSea", reward: "25 USDC" },
  { id: "3", name: "Web3 Gaming Preferences", company: "Axie Infinity", reward: "100 AXS" },
  { id: "4", name: "DAO Governance Survey", company: "Compound", reward: "75 COMP" },
  { id: "5", name: "Layer 2 Usage Patterns", company: "Polygon", reward: "200 MATIC" },
]

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>("home")
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)

  const handleTakeSurvey = (survey: Survey) => {
    setSelectedSurvey(survey)
    setCurrentView("survey")
  }

  const handleSubmitSurvey = () => {
    setCurrentView("reward")
  }

  const handleBackToSurveys = () => {
    setCurrentView("home")
    setSelectedSurvey(null)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {currentView === "home" && (
          <>
            <HeroSection />
            <SurveyTable surveys={mockSurveys} onTakeSurvey={handleTakeSurvey} />
          </>
        )}

        {currentView === "survey" && selectedSurvey && (
          <SurveyPage survey={selectedSurvey} onSubmit={handleSubmitSurvey} onBack={handleBackToSurveys} />
        )}

        {currentView === "reward" && selectedSurvey && (
          <RewardPage survey={selectedSurvey} onBackToSurveys={handleBackToSurveys} />
        )}
      </main>

      <Footer />
    </div>
  )
}
