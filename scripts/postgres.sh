#!/usr/bin/env bash
# =============================================================================
# Conecta Inclusão — PostgreSQL local para desenvolvimento
#
# Uso:
#   ./scripts/postgres.sh install   # baixa e extrai o PostgreSQL 15 (1ª vez)
#   ./scripts/postgres.sh init      # cria o cluster e o banco "conecta"
#   ./scripts/postgres.sh start     # sobe o servidor
#   ./scripts/postgres.sh stop      # para o servidor
#   ./scripts/postgres.sh status    # verifica se está aceitando conexões
#   ./scripts/postgres.sh psql      # abre um shell psql no banco
#
# Preferimos Docker quando disponível:
#   docker run --name conecta-pg -e POSTGRES_USER=conecta \
#     -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 -d postgres:15
#
# Este script existe para ambientes SEM Docker (como o sandbox de
# desenvolvimento), instalando o PostgreSQL em um prefixo gravável.
# =============================================================================
set -euo pipefail

PREFIX="${CONECTA_PG_HOME:-$HOME/.conecta-pgsql}"
ROOT="$PREFIX/root"
DATA="$PREFIX/data"
SOCK="$PREFIX/sock"
LOG="$PREFIX/server.log"
PORT="${PGPORT:-5432}"
DBUSER="${PGUSER:-conecta}"
DBNAME="${PGDATABASE:-conecta}"
# Postgres recusa rodar como root; usamos um UID não-privilegiado.
RUNAS_UID="${CONECTA_PG_UID:-1000}"

export LD_LIBRARY_PATH="$ROOT/usr/lib64:$ROOT/usr/lib64/pgsql:${LD_LIBRARY_PATH:-}"
BIN="$ROOT/usr/bin"

as_pg() {
  if [ "$(id -u)" = "0" ]; then
    setpriv --reuid="$RUNAS_UID" --regid="$RUNAS_UID" --clear-groups \
      env LD_LIBRARY_PATH="$LD_LIBRARY_PATH" "$@"
  else
    env LD_LIBRARY_PATH="$LD_LIBRARY_PATH" "$@"
  fi
}

cmd_install() {
  mkdir -p "$PREFIX/rpm" "$ROOT"
  echo "==> Baixando PostgreSQL 15…"
  dnf install -y --downloadonly --downloaddir="$PREFIX/rpm" \
    --setopt=logdir=/tmp/dnflog --setopt=cachedir=/tmp/dnfcache \
    --setopt=persistdir=/tmp/dnfpersist \
    postgresql15-server postgresql15 >/dev/null
  echo "==> Extraindo…"
  for r in "$PREFIX"/rpm/*.rpm; do
    rpm2archive "$r" >/dev/null
    tar -xzf "$r.tgz" -C "$ROOT"
  done
  echo "==> PostgreSQL instalado em $ROOT"
}

cmd_init() {
  [ -x "$BIN/initdb" ] || { echo "Execute 'install' primeiro."; exit 1; }
  rm -rf "$DATA"
  mkdir -p "$DATA" "$SOCK"
  if [ "$(id -u)" = "0" ]; then
    chown -R "$RUNAS_UID:$RUNAS_UID" "$PREFIX"
  fi
  chmod 700 "$DATA"
  echo "==> Criando cluster…"
  as_pg "$BIN/initdb" -D "$DATA" -U "$DBUSER" --auth=trust --encoding=UTF8 --locale=C >/dev/null
  cmd_start
  echo "==> Criando banco '$DBNAME'…"
  # Espera o servidor aceitar conexões antes de criar o banco. Sem isso, em
  # máquinas lentas o createdb falhava silenciosamente e o banco "$DBNAME"
  # nunca era criado (erro posterior: database "$DBNAME" does not exist).
  wait_ready
  if "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U "$DBUSER" -d postgres -tAc \
       "SELECT 1 FROM pg_database WHERE datname='$DBNAME'" | grep -q 1; then
    echo "   (já existe)"
  else
    "$BIN/createdb" -h 127.0.0.1 -p "$PORT" -U "$DBUSER" "$DBNAME"
  fi
  echo "==> Pronto: postgres://$DBUSER@127.0.0.1:$PORT/$DBNAME"
}

# Aguarda o servidor aceitar conexões (até ~15s).
wait_ready() {
  for _ in $(seq 1 30); do
    if "$BIN/pg_isready" -h 127.0.0.1 -p "$PORT" -U "$DBUSER" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "   (aviso: servidor não respondeu a tempo em 127.0.0.1:$PORT)" >&2
  return 1
}

cmd_start() {
  as_pg "$BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k $SOCK -h 127.0.0.1" -l "$LOG" -w start
  wait_ready
  cmd_status
}

cmd_stop()   { as_pg "$BIN/pg_ctl" -D "$DATA" stop || true; }
cmd_status() { "$BIN/pg_isready" -h 127.0.0.1 -p "$PORT" -U "$DBUSER"; }
cmd_psql()   { "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U "$DBUSER" -d "$DBNAME" "$@"; }

case "${1:-}" in
  install) cmd_install ;;
  init)    cmd_init ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  status)  cmd_status ;;
  psql)    shift; cmd_psql "$@" ;;
  *) sed -n '2,20p' "$0"; exit 1 ;;
esac
