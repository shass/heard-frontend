export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <p className="text-sm text-zinc-500 text-center">© {currentYear} · Heard Labs</p>
        </div>
      </div>
    </footer>
  )
}
