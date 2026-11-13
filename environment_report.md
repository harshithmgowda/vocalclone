# VOXCLONE AI — Autonomous Environment Inspection Report

**Date & Time**: 2026-11-13 12:28 IST  
**Host System**: Windows 11 Home Single Language (64-bit, Build 10.0.26300)  
**Inspection Status**: Complete & Verified

---

## 1. Hardware Summary

| Component | Specification | Status |
| :--- | :--- | :--- |
| **CPU** | AMD Ryzen 7 250 w/ Radeon 780M Graphics (8 Cores, 16 Logical Processors) | Supported & High Performance |
| **System RAM** | 23.31 GB Total (~7.0 GB Free physical memory) | Sufficient for ML & Audio Workloads |
| **Dedicated GPU** | NVIDIA GeForce RTX 5050 Laptop GPU (Blackwell Architecture) | Supported & Active |
| **GPU VRAM** | 8151 MiB (~8 GB GDDR6/GDDR7) | Ideal for F5-TTS inference |
| **NVIDIA Driver** | 616.92 | Supported (CUDA Driver 13.4 / 12.x compatible) |
| **Integrated GPU**| AMD Radeon 780M Graphics (512 MB shared) | Available |
| **Disk Space** | C: Drive — 395.05 GB Free (556.59 GB Used) | Excellent headroom for weights & storage |

---

## 2. Software & Tooling Environment

| Tool / Runtime | Detected Version / Path | Selected Action |
| :--- | :--- | :--- |
| **Python 3.10** | `3.10.10` (`C:\Users\Harshith\AppData\Local\Programs\Python\Python310\python.exe`) | **Primary target for ML backend venv** (Maximum compatibility with PyTorch, torchaudio, F5-TTS) |
| **Python 3.13** | `3.13.12` (`C:\Users\Harshith\AppData\Local\Programs\Python\Python310\python.exe`) | Available (Avoided for ML venv due to wheel availability) |
| **Node.js** | `v24.13.1` | Supported for Vite + React 18/19 Frontend |
| **npm** | `11.8.0` | Ready for package installation |
| **Git** | `2.53.0.windows.1` | Ready for cloning/repo operations |
| **FFmpeg** | `9.0.2-full_build-www.gyan.dev` with CUDA/cuvid/nvdec/opus | Available in system PATH; ideal for audio decoding and resampling |

---

## 3. GPU Acceleration Strategy for F5-TTS

- **GPU Available**: NVIDIA GeForce RTX 5050 Laptop GPU (8GB VRAM).
- **Inference Mode**: GPU-accelerated PyTorch with CUDA (fallback to CPU gracefully if device mismatch occurs).
- **Target PyTorch Version**: PyTorch 2.5.x or 2.6.x with CUDA 12.4 / 12.6 support to leverage the GPU Tensor cores and CUDA runtime.
- **Model Compatibility**: F5-TTS requires ~1.5 - 2.5 GB VRAM for inference, which comfortably fits inside the 8 GB VRAM budget alongside active OS desktop processes.

---

*Report generated autonomously by Antigravity AI Engine.*

