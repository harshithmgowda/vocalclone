#!/usr/bin/env bash
echo "Starting VOXCLONE AI Frontend Studio..."
cd "$(dirname "$0")/frontend" || exit 1
npm run dev -- --host 127.0.0.1 --port 5173

