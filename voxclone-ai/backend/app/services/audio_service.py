import os
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Tuple, Dict, Any
import soundfile as sf
import numpy as np
from app.config import settings

class AudioService:
    @staticmethod
    def validate_and_convert_to_wav(input_path: Path, output_path: Path, target_sr: int = 24000) -> Tuple[float, int]:
        """
        Validates the audio file and converts it to standard 24kHz mono 16-bit PCM WAV.
        Uses FFmpeg first for universal container decoding (WebM, Opus, MP3, M4A, OGG, WAV),
        with fallback to SoundFile + Librosa.
        """
        # Method 1: Universal FFmpeg conversion (handles all browser WebM/Opus/MP3/M4A/etc.)
        try:
            cmd = [
                "ffmpeg", "-y",
                "-i", str(input_path),
                "-vn",
                "-acodec", "pcm_s16le",
                "-ar", str(target_sr),
                "-ac", "1",
                str(output_path)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
            if res.returncode == 0 and output_path.exists() and output_path.stat().st_size > 0:
                info = sf.info(str(output_path))
                return info.duration, info.samplerate
        except Exception as ffmpeg_err:
            print(f"[AudioService] FFmpeg conversion failed or timed out: {ffmpeg_err}, trying SoundFile fallback...")

        # Method 2: SoundFile fallback
        try:
            data, sr = sf.read(str(input_path), dtype='float32')
            if data.ndim > 1:
                data = np.mean(data, axis=1)

            if sr != target_sr:
                try:
                    import librosa
                    data = librosa.resample(data, orig_sr=sr, target_sr=target_sr)
                    sr = target_sr
                except Exception:
                    duration = len(data) / sr
                    new_len = int(duration * target_sr)
                    data = np.interp(
                        np.linspace(0.0, 1.0, new_len, endpoint=False),
                        np.linspace(0.0, 1.0, len(data), endpoint=False),
                        data
                    )
                    sr = target_sr

            max_val = np.max(np.abs(data))
            if max_val > 0.99:
                data = data / max_val * 0.95

            sf.write(str(output_path), data, sr, subtype='PCM_16')
            duration = len(data) / float(sr)
            return duration, sr

        except Exception as e:
            raise ValueError(f"Failed to process or decode audio: {str(e)}")

    @staticmethod
    def inspect_audio(file_path: Path) -> Dict[str, Any]:
        info = sf.info(str(file_path))
        return {
            "duration": info.duration,
            "samplerate": info.samplerate,
            "channels": info.channels,
            "format": info.format,
            "subtype": info.subtype
        }

audio_service = AudioService()
