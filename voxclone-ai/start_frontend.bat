@echo off
setlocal
title VOXCLONE AI - Frontend Studio
echo ========================================================
echo   VOXCLONE AI - Frontend UI Studio Starting...
echo ========================================================

cd /d "%~dp0\frontend"
echo Starting Vite Dev Server on http://localhost:5173...
npm run dev -- --host 127.0.0.1 --port 5173
pause

