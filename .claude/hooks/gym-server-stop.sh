#!/usr/bin/env bash
# Stop any gym-app static server holding the port.
PORT="${GYM_APP_PORT:-8765}"

PIDS=$(lsof -ti:"$PORT" 2>/dev/null)
if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null
    printf '{"systemMessage":"gym-app server stopped"}\n'
else
    printf '{"systemMessage":"gym-app server: nothing to stop"}\n'
fi
