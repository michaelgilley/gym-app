#!/usr/bin/env bash
# Start the gym-app static server detached so it survives this hook.
# Kills any prior process on the port first to avoid collisions on resume.
PORT="${GYM_APP_PORT:-8765}"
DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LOG="/tmp/gym-app-server.log"

PIDS=$(lsof -ti:"$PORT" 2>/dev/null)
if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null
    sleep 0.3
fi

nohup python3 -m http.server "$PORT" --directory "$DIR" >"$LOG" 2>&1 &
disown

printf '{"systemMessage":"gym-app server → http://localhost:%s"}\n' "$PORT"
