#!/bin/sh
# Entry point inside the release bundle. Configure with RPC_URL, CHAIN_ID, CHAIN_NAME, CURRENCY_SYMBOL, DATA_DIR, PORT.
cd "$(dirname "$0")"
export HOSTNAME="${HOSTNAME_BIND:-0.0.0.0}"
export PORT="${PORT:-3000}"
export NODE_ENV=production
exec node --no-warnings=ExperimentalWarning server.js
