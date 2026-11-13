@echo off
setlocal
title VOXCLONE AI - Backend Server
echo ========================================================
echo   VOXCLONE AI - Backend Server Starting...
echo   Device: NVIDIA RTX 5050 / CUDA 12.8 Acceleration
echo ========================================================

cd /d "%~dp0\backend"
if not exist "venv\Scripts\python.exe" (
    echo Error: Python virtual environment not found at backend\venv!
    pause
    exit /b 1
)

echo Starting Uvicorn API server on http://localhost:8000...
echo API Docs available at: http://localhost:8000/docs
"venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause

