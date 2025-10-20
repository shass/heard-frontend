"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, CheckCircle2 } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface UserReward {
  claimLink?: string
  heardPointsAwarded: number
  usedAt?: string
  survey?: {
    rewardAmount: number
    rewardToken: string
  }
}

interface SurveyRewardProps {
  userReward: UserReward
  onClaimReward: () => void
  onCopyClaimLink: () => void
}

export function SurveyReward({ userReward, onClaimReward, onCopyClaimLink }: SurveyRewardProps) {
  const hasClaimLink = !!userReward?.claimLink

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reward</CardTitle>
        <CardDescription>
          Congratulations! You have completed this survey and earned your reward.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Reward Summary */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Survey Completed!</span>
            </div>
            <div className="text-sm text-green-700">
              <p>Token Reward: {formatNumber(userReward.survey?.rewardAmount || 0)} {userReward.survey?.rewardToken}</p>
              <p>HeardPoints Earned: {formatNumber(userReward.heardPointsAwarded)} HP</p>
              {userReward.usedAt && (
                <p>Reward given: {new Date(userReward.usedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Claim Actions - only show if claim link is available */}
          {hasClaimLink && (
            <div className="space-y-3">
              <div className="text-sm text-zinc-600">
                Use the link below to claim your {formatNumber(userReward.survey?.rewardAmount || 0)} {userReward.survey?.rewardToken} tokens:
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={onClaimReward}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Claim Reward
                </Button>

                <Button
                  onClick={onCopyClaimLink}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-2 bg-white rounded-lg border">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(userReward.claimLink!)}`}
                    alt="QR Code for reward claim"
                    className="w-30 h-30"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">Scan with your wallet app</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}