import { motion, AnimatePresence } from "motion/react"
import { MobileSurveyCard } from "./MobileSurveyCard"
import type { Survey } from "@/lib/types"

interface MobileSurveyListProps {
  surveys: Survey[]
  onTakeSurvey: (survey: Survey) => void
  onCopyLink: (surveyId: string) => void
  copiedSurveyId: string | null
}

export function MobileSurveyList({ 
  surveys, 
  onTakeSurvey, 
  onCopyLink, 
  copiedSurveyId 
}: MobileSurveyListProps) {
  return (
    <motion.div
      className="lg:hidden space-y-4 relative"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
    >
      <AnimatePresence mode="popLayout">
        {surveys.map((survey) => (
          <motion.div
            key={survey.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: 100,
              scale: 0.95,
              transition: {
                duration: 0.3,
                ease: "easeInOut"
              }
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 120
            }}
            style={{
              transformOrigin: 'center center'
            }}
          >
            <MobileSurveyCard
              survey={survey}
              onTakeSurvey={onTakeSurvey}
              onCopyLink={onCopyLink}
              copiedSurveyId={copiedSurveyId}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}