"use client"

import { motion, AnimatePresence } from "motion/react"
import { Survey } from "@/lib/types"
import React from 'react';

interface MotionSurveyTableProps {
  surveys: Survey[]
  renderRow: (survey: Survey) => React.ReactNode
}

// Spring configuration based on iOS/Material Design guidelines
const springConfig = {
  type: "spring" as const,
  damping: 25,
  stiffness: 120,
  mass: 1,
}

// Staggered animation for multiple items
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02, // 20ms stagger between items
    }
  }
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const
    }
  }
}

export function MotionSurveyTable({ surveys, renderRow }: MotionSurveyTableProps) {
  return (
    <motion.tbody
      className="divide-y divide-zinc-200"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {surveys.map((survey) => (
          <motion.tr
            key={survey.id}
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="hover:bg-zinc-50 transition-colors duration-150"
            style={{
              // Optimize for animations
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              perspective: 1000,
            }}
            whileHover={{
              scale: 1.01,
              transition: { duration: 0.15 }
            }}
          >
            {renderRow(survey)}
          </motion.tr>
        ))}
      </AnimatePresence>
    </motion.tbody>
  )
}
