#!/usr/bin/env bash
# Sobe backend (4000) e preview do frontend (5173) de forma detached, para
# inspeção manual/E2E. Uso: bash scripts/serve-local.sh
cd "$(dirname "$0")/.." || exit 1
setsid node server/src/index.js > /tmp/api.log 2>&1 < /dev/null &
setsid npx vite preview > /tmp/preview.log 2>&1 < /dev/null &
sleep 1
echo "launched api(4000) + preview(5173)"
