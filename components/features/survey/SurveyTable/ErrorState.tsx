import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  error: Error | null
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Failed to load surveys</h3>
          <p className="text-zinc-600 mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button onClick={onRetry} className="bg-orange-500 hover:bg-orange-600">
            Try Again
          </Button>
        </div>
      </div>
    </section>
  )
}