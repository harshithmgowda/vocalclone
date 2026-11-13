# VOXCLONE AI — Installation Report

**Date**: 2026-11-13  
**Status**: 100% Installed, Configured & Verified Operational  
**Platform**: Windows 11 Home Single Language (64-bit)  
**Primary Accelerator**: NVIDIA GeForce RTX 5050 Laptop GPU (8GB VRAM)

---

## 1. Environment & Dependency Summary

### A. Python Environment
- **Python Version**: Python 3.10.10 (`C:\Users\Harshith\AppData\Local\Programs\Python\Python310\python.exe`)
- **Virtual Environment**: `voxclone-ai\backend\venv`
- **PyTorch Package**: `torch-2.11.0+cu128` & `torchaudio-2.11.0+cu128`
  - *Technical Discovery & Resolution*: The NVIDIA RTX 5050 Laptop GPU uses the brand-new Blackwell architecture with compute capability `sm_120`. Standard PyTorch 2.6 CUDA 12.4 threw `RuntimeError: CUDA error: no kernel image is available for execution on the device`. Upgrading to PyTorch with CUDA 12.8 wheel (`cu128`) resolved this issue, providing full native hardware tensor acceleration on `sm_120`.
- **Audio Decoder Compatibility**: Torchaudio 2.11 attempts to load external C++ shared libraries for `torchcodec`. Routed audio loading through pure `soundfile` (`sf.read`) to guarantee rock-solid cross-platform WAV decoding without requiring missing Windows DLLs.
- **F5-TTS & Neural Vocoder**: Installed `f5-tts-1.1.22` and `vocos-0.1.0`. Model weights for `F5TTS_v1_Base` (1250000 steps) and Vocos 24kHz mel-vocoder were downloaded and cached locally from Hugging Face Hub.
- **Whisper Integration**: `faster-whisper-1.2.1` installed for automated reference audio speech-to-text.

### B. Frontend Environment
- **Framework**: React 18 + Vite + TypeScript + Tailwind CSS
- **Icons**: Lucide React
- **Audio Visualizer**: HTML5 Canvas + Web Audio API (`AudioContext` / `AnalyserNode`)
- **Build Status**: Verified via `npm run build` (0 errors, 2092 modules bundled in 1.66s).

---

## 2. Pinned Backend Packages

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.7.0
python-multipart>=0.0.9
soundfile>=0.12.1
numpy<=1.26.4
f5-tts>=1.1.22
vocos>=0.1.0
faster-whisper>=1.0.0
aiofiles>=24.0.0
librosa>=0.10.0
transformers>=4.40.0
pytest>=8.0.0
httpx>=0.27.0
```

---

## 3. Storage Architecture

```
voxclone-ai/
  backend/
    storage/
      voices/          # Standardized 24kHz mono WAV reference recordings
      generated/       # Synthesized WAV audio clips
      temporary/       # Short-lived upload staging
      database/        # Persistent SQLite DB (voxclone.db)
```

---

*Report certified by Antigravity AI Autonomous Engine.*

