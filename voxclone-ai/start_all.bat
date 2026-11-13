@echo off
setlocal
title VOXCLONE AI - Neural Voice Cloning Studio Launcher
echo ========================================================
echo   VOXCLONE AI - Neural Voice Cloning Studio Launcher
echo   "Your Voice. Your AI. Your Words."
echo ========================================================

echo Launching Backend server...
start "VOXCLONE Backend" cmd /c "%~dp0start_backend.bat"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo Launching Frontend studio...
start "VOXCLONE Frontend" cmd /c "%~dp0start_frontend.bat"

echo.
echo ========================================================
echo   Both services launched successfully!
echo   Frontend Studio : http://localhost:5173
echo   Backend API     : http://localhost:8000
echo   API Swagger UI  : http://localhost:8000/docs
echo ========================================================
echo.
pause

