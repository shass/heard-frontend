"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SurveyTable } from "@/components/survey-table"
import { Footer } from "@/components/footer"
import { HomePageWrapper } from "@/components/cache-warming-wrapper"
import { useRouter } from "next/navigation"
import type { Survey } from "@/lib/types"

export default function Home() {
  const router = useRouter()

  const handleTakeSurvey = (survey: Survey) => {
    router.push(`/surveys/${survey.id}/info`)
  }

  return (
    <HomePageWrapper>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />

        <main id="main-content" className="flex-1">
          <HeroSection />
          <SurveyTable onTakeSurvey={handleTakeSurvey} />
        </main>

        <Footer />
      </div>
    </HomePageWrapper>
  )
}
