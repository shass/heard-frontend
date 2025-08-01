'use client'

import { XIcon, MailIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { useCreateSurveyModal } from '@/hooks/use-create-survey-modal'

interface FooterProps {
  onCreateSurvey?: () => void
}

export function Footer({ onCreateSurvey }: FooterProps = {}) {
  const currentYear = new Date().getFullYear()
  const { openModal } = useCreateSurveyModal()

  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Mobile Create Survey Button */}
          <div className="flex justify-center mb-6 sm:hidden">
            <Button
              onClick={() => {
                if (onCreateSurvey) {
                  onCreateSurvey()
                } else {
                  openModal()
                }
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-6 py-3 font-medium w-full max-w-xs"
            >
              Create survey
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-zinc-500 order-2 sm:order-1">© {currentYear} · Heard Labs</p>
            <div className="flex items-center space-x-4 order-1 sm:order-2">
              <a
                href="mailto:contact@heardlabs.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-700 transition-colors"
                aria-label="Contact us via email"
                title="Contact us via email"
              >
                <MailIcon className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/Heard_labs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-700 transition-colors"
                aria-label="Follow us on X (formerly Twitter)"
                title="Follow us on X"
              >
                <XIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
