# Prediction Market Survey Type Plugin

Time-gated survey with pool-based rewards for correct predictions.

## Overview

Users make predictions by answering survey questions. When the survey ends, correct predictors split the reward pool (95% to winners, 5% platform fee).

## Features

- ✅ Time-gated (startDate/endDate required)
- ✅ Single-choice questions only
- ✅ Wallet connection required
- ✅ No anonymous responses
- ✅ No multiple responses per user
- ✅ Pool-based reward distribution

## Configuration

```typescript
{
  allowAnonymous: false,
  allowMultipleResponses: false,
  requireWallet: true,
  supportedQuestionTypes: ['single'],
  maxQuestions: 10,
  minResponses: 10,
  requiresTimeGating: true,
}
```

## Usage

```typescript
import { PredictionMarketSurveyType } from '@/src/survey-types/prediction-market'

const surveyType = new PredictionMarketSurveyType()

// Get configuration
const config = surveyType.getConfig()

// Validate questions
const validation = surveyType.validateQuestions(questions)

// Check user access
const access = await surveyType.checkAccess(user, survey)

// Get reward strategy
const rewardStrategy = surveyType.getRewardStrategy()
```

## Reward Distribution

- **Total Pool**: Set per survey (e.g., 1000 HeardPoints)
- **Platform Fee**: 5%
- **Winners Pool**: 95%
- **Distribution**: Equal split among all correct predictors

Example:
- Total pool: 1000 HP
- Platform fee: 50 HP (5%)
- Winners pool: 950 HP (95%)
- Winners count: 10
- Reward per winner: 95 HP

## Validation Rules

### Questions
- Maximum 10 questions per survey
- Only `single` choice questions allowed
- Each question must have at least 2 answer options
- All questions should be required (recommended)

### Responses
- Each response must have exactly 1 selected answer
- Responses only accepted within survey time window (startDate to endDate)
- User can only respond once per survey

## Lifecycle

1. **Survey Creation** (`onSurveyCreate`)
   - Survey initialized with startDate/endDate
   - Pool amount configured

2. **User Participation**
   - Access check (wallet + time window)
   - Response validation
   - Response recorded

3. **Survey Completion** (`onSurveyComplete`)
   - Market resolved when endDate reached
   - Correct answers determined
   - Winners identified
   - Pool distributed via `PredictionMarketRewardStrategy`

## TODO

- [ ] Integrate with backend API for response fetching
- [ ] Implement market resolution logic
- [ ] Add blockchain integration for pool distribution
- [ ] Create custom question renderer with countdown timer
- [ ] Create custom results renderer showing winners
- [ ] Add notifications for reward distribution
- [ ] Implement automated market resolution at endDate
