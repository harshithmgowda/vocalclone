#!/usr/bin/env bash
echo "Launching VOXCLONE AI..."
SCRIPT_DIR="$(dirname "$0")"
bash "$SCRIPT_DIR/start_backend.sh" &
sleep 3
bash "$SCRIPT_DIR/start_frontend.sh" &
echo "VOXCLONE AI services running at:"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"

