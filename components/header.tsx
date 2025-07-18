// SSR-safe Header component
import dynamic from 'next/dynamic'

// Dynamically import the client component to avoid SSR issues
const HeaderClient = dynamic(
  () => import('./header-client').then(mod => ({ default: mod.HeaderClient })),
  { 
    ssr: false,
    loading: () => (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center h-40">
              <div className="h-40 w-[200px] bg-zinc-100 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-32 bg-zinc-100 rounded-lg animate-pulse"></div>
              <div className="h-10 w-32 bg-zinc-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }
)

export function Header() {
  return <HeaderClient />
}
