import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Survey } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0 || !isFinite(seconds)) return '0s'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  const parts: string[] = []

  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`)

  return parts.join(' ')
}

/**
 * Format address for display (show first and last few characters)
 */
export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format numbers with thousands separators
 */
export function formatNumber(num: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Survey time status for prediction surveys
 */
export type SurveyTimeStatus = 'planned' | 'started' | 'finished'

/**
 * Get survey time status based on current time and survey dates
 */
export function getSurveyTimeStatus(
  startDate?: string | null,
  endDate?: string | null
): SurveyTimeStatus {
  if (!startDate || !endDate) {
    return 'planned'
  }

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) {
    return 'planned'
  } else if (now >= start && now < end) {
    return 'started'
  } else {
    return 'finished'
  }
}

/**
 * Format date for survey display
 */
export function formatSurveyDate(dateString?: string | null): string {
  if (!dateString) return 'Not set'

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}

/**
 * Check if survey has ended based on endDate
 */
export function isSurveyEnded(survey: Survey): boolean {
  if (!survey.endDate) return false
  const now = new Date()
  const endDate = new Date(survey.endDate)
  return now >= endDate
}
