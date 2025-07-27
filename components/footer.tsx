import { X } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-zinc-500 order-2 sm:order-1">© {currentYear} · Heard Labs</p>
            <a
              href="https://x.com/Heard_labs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-700 transition-colors order-1 sm:order-2"
              aria-label="Follow us on X (formerly Twitter)"
            >
              <X className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
