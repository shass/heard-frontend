import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function SurveyInfoLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" /> {/* Back button */}
              <div className="flex-1">
                <Skeleton className="h-8 w-3/4 mb-2" /> {/* Title */}
                <Skeleton className="h-4 w-1/2" /> {/* Company */}
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/4" /> {/* Section title */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Detailed description skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" /> {/* Section title */}
              <Skeleton className="h-32 w-full" /> {/* Content */}
            </div>

            {/* Action button skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}