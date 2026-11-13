#!/usr/bin/env bash
echo "Starting VOXCLONE AI Backend..."
cd "$(dirname "$0")/backend" || exit 1
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

