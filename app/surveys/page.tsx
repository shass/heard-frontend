"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SurveysPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page (now contains surveys)
    router.push("/")
  }, [router])

  return null
}