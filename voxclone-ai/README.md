# VOXCLONE AI — Personal AI Voice Cloning Studio
> **"Your Voice. Your AI. Your Words."**

VOXCLONE AI is a production-grade, local personal voice cloning and speech synthesis studio powered by **F5-TTS** (Flow-Matching Non-Autoregressive Transformer) and the **Vocos** neural vocoder. It provides an intuitive, high-fidelity dark-themed interface inspired by Linear and ElevenLabs, running with hardware acceleration on your NVIDIA GeForce RTX 5050 GPU.

---

## 🚀 Live Access Addresses

The application is currently configured and running at:

- **Frontend Studio UI**: [http://localhost:5173](http://localhost:5173) (or [http://127.0.0.1:5173](http://127.0.0.1:5173))
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Telemetry**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## ✨ Features

1. **Microphone Voice Recording**: Real-time microphone capture with animated Web Audio API waveform visualization, duration timer, and immediate playback preview.
2. **Audio File Upload**: Upload pre-recorded reference voice samples in WAV, MP3, M4A, OGG, or WebM format.
3. **Reference Audio Validation & Resampling**: Automatically normalizes and resamples reference audio to 24kHz 16-bit mono WAV.
4. **Automated & Manual Transcription**: Uses Whisper (`faster-whisper`) to transcribe reference audio with one click, or allows manual transcript editing.
5. **F5-TTS Neural Voice Cloning**: Real-time conditional voice synthesis with fine-tuning parameters (NFE steps, speaking pace, classifier-free guidance).
6. **Built-in Waveform Audio Player**: Scrub bar, play/pause, duration counter, volume slider, replay, and instant WAV download.
7. **Voice Library ("My Voices")**: Manage saved reference voices, play previews, edit voice profile names, and delete recordings.
8. **Generation History**: Comprehensive log of all generated speech clips with full audio playback, timestamp, hardware device metadata, and deletion options.
9. **Settings & Cleanup**: Hardware telemetry monitor (RTX 5050 / sm_120, VRAM usage), temporary file purge, and local data reset.
10. **Responsible AI & Privacy**: Enforced ownership/consent verification checkbox and local SQLite storage with zero cloud telemetry.

---

## 🛠️ Technology Stack

- **Backend**:
  - Python 3.10.10
  - FastAPI & Uvicorn
  - PyTorch 2.11.0 + CUDA 12.8 (Blackwell `sm_120` support)
  - F5-TTS (`f5-tts-1.1.22`)
  - Vocos Mel-Vocoder (`vocos-0.1.0`)
  - Faster-Whisper (`faster-whisper-1.2.1`)
  - SoundFile & Librosa
  - SQLite3
- **Frontend**:
  - React 18 + Vite + TypeScript
  - Tailwind CSS + Custom Dark Studio Palette
  - Lucide React Icons
  - Web Audio API & HTML5 Canvas

---

## 📦 How to Start the Studio

### Quick Start (Windows)
Double-click `start_all.bat` in the project root:
```bat
start_all.bat
```
Or start each service independently:
- **Backend**: `start_backend.bat`
- **Frontend**: `start_frontend.bat`

### Quick Start (Linux / macOS)
```bash
bash start_all.sh
```

---

## 🎙️ Step-by-Step User Workflow

### 1. Select or Record a Reference Voice
- Navigate to the **Studio** tab.
- Click **Start Recording** (speak 3–10 seconds in a quiet room) or switch to **Upload File** to upload a `.wav` or `.mp3` file.
- Check the **Authorized Consent** box to verify you own or have permission to clone this voice.
- Click **Auto-Transcribe** (or type what was spoken into the Reference Transcript box).
- Click **Confirm Reference Voice**.

### 2. Enter Target Speech Prompt
- In the right-hand panel, type any text you want your AI cloned voice to say (or click one of the preset pills).
- (Optional) Toggle **Advanced Model Parameters** to adjust NFE steps (16–32), pacing speed, or CFG strength.

### 3. Generate & Download
- Click **Generate Speech with Cloned Voice**.
- The neural flow-matching model will synthesize speech directly on your GPU in ~15–20 seconds.
- The **Generated Audio Output** player appears below. Listen, scrub through the audio, and click **Download WAV**!

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status, GPU acceleration, and VRAM telemetry |
| `GET` | `/api/model/status` | Model status and device information |
| `POST` | `/api/voice/upload` | Upload and validate reference audio |
| `GET` | `/api/voice/{id}/audio` | Stream reference audio file |
| `POST` | `/api/voice/{id}/transcribe` | Transcribe reference audio using Whisper |
| `GET` | `/api/voices` | List saved voices in library |
| `PATCH` | `/api/voices/{id}` | Rename voice or update transcript |
| `DELETE` | `/api/voices/{id}` | Delete voice record and audio file |
| `POST` | `/api/voice/{id}/generate` | Run F5-TTS voice synthesis |
| `GET` | `/api/generation/{id}/status` | Get generation record status |
| `GET` | `/api/audio/{id}` | Stream or download generated WAV file |
| `GET` | `/api/history` | List previous speech generations |
| `DELETE` | `/api/history/{id}` | Delete generation record and audio file |
| `POST` | `/api/settings/cleanup` | Purge temporary staged files |

---

## 🔒 Security & Privacy Notice

- **No Cloud Transmission**: All reference audio files, transcripts, and generated audio remain on your local hard drive in `backend/storage/`.
- **Consent Enforcement**: The application requires explicit user confirmation before processing any reference audio.
- **AI Audio Disclosure**: Generated speech files are explicitly identified as AI synthetic audio for ethical transparency.

---

*Authored autonomously for VOXCLONE AI.*
