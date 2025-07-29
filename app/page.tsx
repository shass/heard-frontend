"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SurveyTable } from "@/components/survey-table"
import { Footer } from "@/components/footer"
import { CreateSurveyModal } from "@/components/ui/create-survey-modal"
import { useRouter } from "next/navigation"
import type { Survey } from "@/lib/types"

export default function Home() {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleTakeSurvey = (survey: Survey) => {
    router.push(`/surveys/${survey.id}/info`)
  }

  const handleCreateSurvey = () => {
    setShowCreateModal(true)
  }

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
        <Header onCreateSurvey={handleCreateSurvey} />

        <main id="main-content" className="flex-1">
          <HeroSection />
          <SurveyTable onTakeSurvey={handleTakeSurvey} />
        </main>

        <Footer onCreateSurvey={handleCreateSurvey} />
      </div>

      <CreateSurveyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  )
}
