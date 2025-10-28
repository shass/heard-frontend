#!/bin/bash

# HEARD Frontend Warmup Script
# Warms up Next.js SSR pages after deployment to avoid cold starts
#
# Usage:
#   ./scripts/warmup.sh                    # Warmup localhost (default)
#   ./scripts/warmup.sh https://heard.app  # Warmup production
#   ./scripts/warmup.sh https://heard.app 30  # Warmup with custom limit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get URL from first argument or use localhost
URL="${1:-http://localhost:3000}"
LIMIT="${2:-20}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  HEARD Frontend Warmup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Target:${NC} $URL"
echo -e "${YELLOW}Limit:${NC}  $LIMIT surveys"
echo ""

# Check if server is reachable
echo -e "${BLUE}[1/3]${NC} Checking server health..."
HEALTH_URL="$URL/api/health"

if curl -s -f -m 10 "$HEALTH_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Server is healthy"
else
  echo -e "${RED}✗${NC} Server health check failed"
  echo -e "${YELLOW}→${NC} Continuing anyway (server might not have health endpoint yet)"
fi

echo ""

# Run warmup
echo -e "${BLUE}[2/3]${NC} Running warmup..."
WARMUP_URL="$URL/api/warmup?limit=$LIMIT"

START_TIME=$(date +%s)

if RESPONSE=$(curl -s -f -m 120 "$WARMUP_URL"); then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  echo -e "${GREEN}✓${NC} Warmup completed in ${DURATION}s"

  # Parse response (requires jq for pretty output, falls back to raw JSON)
  if command -v jq &> /dev/null; then
    echo ""
    echo -e "${BLUE}[3/3]${NC} Results:"
    echo ""

    TOTAL=$(echo "$RESPONSE" | jq -r '.stats.total')
    SUCCESSFUL=$(echo "$RESPONSE" | jq -r '.stats.successful')
    FAILED=$(echo "$RESPONSE" | jq -r '.stats.failed')
    TOTAL_TIME=$(echo "$RESPONSE" | jq -r '.stats.totalTime')
    AVG_TIME=$(echo "$RESPONSE" | jq -r '.stats.averageTime')

    echo -e "${YELLOW}Pages warmed up:${NC}    $TOTAL"
    echo -e "${GREEN}Successful:${NC}        $SUCCESSFUL"

    if [ "$FAILED" -gt 0 ]; then
      echo -e "${RED}Failed:${NC}            $FAILED"
    else
      echo -e "${GREEN}Failed:${NC}            $FAILED"
    fi

    echo -e "${YELLOW}Total time:${NC}        ${TOTAL_TIME}ms"
    echo -e "${YELLOW}Average time/page:${NC} ${AVG_TIME}ms"

    # Show failed URLs if any
    if [ "$FAILED" -gt 0 ]; then
      echo ""
      echo -e "${RED}Failed URLs:${NC}"
      echo "$RESPONSE" | jq -r '.results[] | select(.status == "error") | "  → \(.url) - \(.error)"'
    fi

  else
    echo ""
    echo -e "${YELLOW}Install jq for pretty output:${NC} brew install jq"
    echo ""
    echo -e "${BLUE}Raw response:${NC}"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  fi

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Warmup successful!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

else
  echo -e "${RED}✗${NC} Warmup failed"
  echo ""
  echo -e "${RED}Please check:${NC}"
  echo "  1. Server is running at $URL"
  echo "  2. /api/warmup endpoint exists"
  echo "  3. Backend API is accessible"
  echo ""
  exit 1
fi
