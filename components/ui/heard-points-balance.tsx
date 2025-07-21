'use client'

import { useEffect, useState } from 'react'
import { useAutoRefreshHeardPoints } from '@/hooks/use-users'
import { useUser } from '@/lib/store'
import { HeardPointsHistoryModal } from '@/components/lazy'
import { History } from 'lucide-react'

interface HeardPointsBalanceProps {
  className?: string
  showLabel?: boolean
  refreshInterval?: number
  clickable?: boolean
  onBalanceChange?: (newBalance: number, previousBalance: number) => void
}

export function HeardPointsBalance({ 
  className = "", 
  showLabel = true, 
  refreshInterval = 30000,
  clickable = true,
  onBalanceChange 
}: HeardPointsBalanceProps) {
  const user = useUser()
  const [previousBalance, setPreviousBalance] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationType, setAnimationType] = useState<'increase' | 'decrease' | null>(null)
  const [displayedBalance, setDisplayedBalance] = useState<number>(0)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  
  // Get HeardPoints with auto-refresh
  const { data: heardPoints, isLoading: pointsLoading } = useAutoRefreshHeardPoints(refreshInterval)
  
  // Use fallback to user balance if API is not available
  const currentBalance = heardPoints?.currentBalance ?? user?.heardPointsBalance ?? 0
  
  // Initialize displayed balance
  useEffect(() => {
    if (displayedBalance === 0 && currentBalance > 0) {
      setDisplayedBalance(currentBalance)
      setPreviousBalance(currentBalance)
    }
  }, [currentBalance, displayedBalance])
  
  // Animate balance changes
  useEffect(() => {
    if (previousBalance !== null && currentBalance !== previousBalance) {
      const difference = currentBalance - previousBalance
      setAnimationType(difference > 0 ? 'increase' : 'decrease')
      setIsAnimating(true)
      
      // Animate the number counting up/down
      const animationDuration = 1000
      const steps = 20
      const stepDuration = animationDuration / steps
      const increment = difference / steps
      
      let currentStep = 0
      const interval = setInterval(() => {
        currentStep++
        const newValue = previousBalance + (increment * currentStep)
        
        if (currentStep >= steps) {
          clearInterval(interval)
          setDisplayedBalance(currentBalance)
          setTimeout(() => {
            setIsAnimating(false)
            setAnimationType(null)
          }, 500)
        } else {
          setDisplayedBalance(Math.round(newValue))
        }
      }, stepDuration)
      
      // Call callback if provided
      if (onBalanceChange) {
        onBalanceChange(currentBalance, previousBalance)
      }
      
      setPreviousBalance(currentBalance)
      
      return () => clearInterval(interval)
    }
  }, [currentBalance, previousBalance, onBalanceChange])
  
  if (pointsLoading && displayedBalance === 0) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <span className="text-sm font-semibold text-zinc-400 animate-pulse">
          ---
        </span>
        {showLabel && <span className="text-sm text-zinc-600">HP</span>}
      </div>
    )
  }
  
  const BalanceContent = () => (
    <div className={`flex items-center space-x-1 ${className} ${clickable ? 'cursor-pointer hover:bg-zinc-100 rounded-lg p-1 transition-colors' : ''}`}>
      <span 
        className={`text-sm font-semibold transition-all duration-500 ${
          isAnimating 
            ? animationType === 'increase' 
              ? 'text-green-600 scale-110' 
              : 'text-red-600 scale-110'
            : 'text-zinc-900'
        }`}
      >
        {displayedBalance.toLocaleString()}
      </span>
      {showLabel && <span className="text-sm text-zinc-600">HP</span>}
      
      {/* Clickable history icon */}
      {clickable && (
        <History className="w-3 h-3 text-zinc-400 hover:text-zinc-600 ml-1" />
      )}
      
      {/* Animation indicator */}
      {isAnimating && previousBalance !== null && (
        <div className={`text-xs animate-bounce ${
          animationType === 'increase' ? 'text-green-600' : 'text-red-600'
        }`}>
          {animationType === 'increase' ? '+' : '-'}
          {Math.abs(currentBalance - previousBalance)}
        </div>
      )}
      
      {/* Floating animation for increases */}
      {isAnimating && animationType === 'increase' && (
        <div className="absolute top-0 left-0 pointer-events-none">
          <div className="text-xs text-green-600 font-semibold animate-ping">
            +{Math.abs(currentBalance - (previousBalance || 0))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {clickable ? (
        <div onClick={() => setShowHistoryModal(true)}>
          <BalanceContent />
        </div>
      ) : (
        <BalanceContent />
      )}
      
      <HeardPointsHistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  )
}
