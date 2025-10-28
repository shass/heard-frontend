#!/bin/bash

# Start Next.js server in background
echo "Starting Next.js server..."
npm start &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"

# Wait for server to be ready (max 30 seconds)
echo "Waiting for server to be ready..."
for i in {1..30}; do
  if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Server is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "⚠ Timeout waiting for server"
    wait $SERVER_PID
    exit 1
  fi
  sleep 1
done

# Get the app URL from environment or use localhost
APP_URL="${APP_URL:-http://localhost:3000}"

# Run warmup in background (don't block server)
echo "Running warmup in background..."
(
  sleep 5  # Extra delay to ensure server is fully ready
  echo "Starting warmup for: $APP_URL"

  if curl -sf -m 120 "$APP_URL/api/warmup?limit=20" > /tmp/warmup-result.json 2>&1; then
    echo "✓ Warmup completed successfully"
    cat /tmp/warmup-result.json | head -20  # Show first 20 lines
  else
    echo "⚠ Warmup failed (this is non-critical)"
  fi
) &

# Keep server running in foreground
echo "Keeping server running..."
wait $SERVER_PID
