#!/usr/bin/env bash
# Sobe a stack completa para inspeção local: PostgreSQL + API + preview do front.
# Mantém os processos vivos em background (nohup) e imprime o estado.
cd "$(dirname "$0")/.." || exit 1
export CONECTA_PG_HOME="${CONECTA_PG_HOME:-$(pwd)/.pgsql}"

bash scripts/postgres.sh start >/dev/null 2>&1 || true
setsid env CONECTA_PG_HOME="$CONECTA_PG_HOME" npx --prefix server tsx server/src/index.ts > /tmp/api.log 2>&1 < /dev/null &
setsid npx vite preview > /tmp/preview.log 2>&1 < /dev/null &
sleep 1
echo "stack launched (pg + api:3001 + preview:5173)"
