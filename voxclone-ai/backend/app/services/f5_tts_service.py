import os
import gc
import threading
import time
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import soundfile as sf
import torch
import torchaudio
from app.config import settings

# Monkey-patch torchaudio.load with soundfile to avoid torchcodec Windows DLL issues
def _safe_torchaudio_load(filepath, *args, **kwargs):
    data, sr = sf.read(filepath, dtype='float32')
    tensor = torch.from_numpy(data)
    if tensor.ndim == 1:
        tensor = tensor.unsqueeze(0)
    elif tensor.ndim == 2:
        tensor = tensor.t()
    return tensor, sr

torchaudio.load = _safe_torchaudio_load


class F5TTSService:
    def __init__(self):
        self._model = None
        self._model_status = "unloaded"  # 'unloaded', 'loading', 'ready', 'error'
        self._lock = threading.Lock()
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        self._error_message = None

    def initialize_model(self):
        """Initializes and preloads the F5-TTS model singleton onto the GPU/CPU."""
        with self._lock:
            if self._model is not None and self._model_status == "ready":
                return

            self._model_status = "loading"
            try:
                from f5_tts.api import F5TTS
                print(f"[F5TTSService] Initializing F5-TTS on device: {self._device}...")
                
                # Check CUDA availability
                if self._device == "cuda" and not torch.cuda.is_available():
                    self._device = "cpu"
                    print("[F5TTSService] CUDA requested but unavailable, falling back to CPU.")

                self._model = F5TTS(device=self._device)
                self._model_status = "ready"
                print(f"[F5TTSService] F5-TTS loaded successfully on {self._device}!")
            except Exception as e:
                self._model_status = "error"
                self._error_message = str(e)
                print(f"[F5TTSService] Error loading F5-TTS model: {e}")
                # Try CPU fallback if cuda failed
                if self._device == "cuda":
                    print("[F5TTSService] Attempting CPU fallback...")
                    try:
                        from f5_tts.api import F5TTS
                        self._device = "cpu"
                        self._model = F5TTS(device="cpu")
                        self._model_status = "ready"
                        self._error_message = None
                        print("[F5TTSService] F5-TTS loaded successfully on CPU fallback.")
                    except Exception as fallback_err:
                        self._model_status = "error"
                        self._error_message = f"GPU and CPU initialization failed: {str(fallback_err)}"

    def get_model_status(self) -> Dict[str, Any]:
        """Returns the current status of the model and hardware."""
        gpu_name = None
        vram_allocated_mb = None
        vram_total_mb = None

        if torch.cuda.is_available():
            try:
                gpu_name = torch.cuda.get_device_name(0)
                vram_allocated_mb = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2)
                vram_total_mb = round(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024), 2)
            except Exception:
                pass

        return {
            "model_status": self._model_status,
            "model_loaded": self._model is not None and self._model_status == "ready",
            "device": self._device,
            "cuda_available": torch.cuda.is_available(),
            "gpu_name": gpu_name,
            "vram_allocated_mb": vram_allocated_mb,
            "vram_total_mb": vram_total_mb,
            "error_message": self._error_message,
        }

    def generate_speech(
        self,
        ref_audio_path: str,
        ref_text: str,
        gen_text: str,
        output_wav_path: str,
        nfe_steps: int = 32,
        speed: float = 1.0,
        cfg_strength: float = 2.0,
    ) -> Tuple[float, int]:
        """
        Runs neural voice cloning using F5-TTS.
        Thread-safe: executes with a lock to prevent concurrent VRAM spikes.
        Returns: (duration_seconds, sample_rate)
        """
        if self._model is None or self._model_status != "ready":
            self.initialize_model()
            if self._model_status != "ready":
                raise RuntimeError(f"F5-TTS model is not ready: {self._error_message}")

        with self._lock:
            start_time = time.time()
            try:
                from app.services.kannada_service import is_kannada, kannada_to_phonetic

                # Convert Kannada to phonetic Latin if present
                actual_gen_text = kannada_to_phonetic(gen_text) if is_kannada(gen_text) else gen_text
                actual_ref_text = kannada_to_phonetic(ref_text) if is_kannada(ref_text) else ref_text

                print(f"[F5TTSService] Starting voice cloning inference ({nfe_steps} steps, speed={speed})...")
                if is_kannada(gen_text):
                    print(f"[F5TTSService] Kannada phonetics applied: '{actual_gen_text}'")

                # Run inference through official F5TTS API
                self._model.infer(
                    ref_file=ref_audio_path,
                    ref_text=actual_ref_text,
                    gen_text=actual_gen_text,
                    file_wave=output_wav_path,
                    nfe_step=nfe_steps,
                    speed=speed,
                    cfg_strength=cfg_strength,
                    remove_silence=False
                )

                elapsed = time.time() - start_time
                print(f"[F5TTSService] Inference completed in {elapsed:.2f}s!")

                # Verify and inspect generated file
                info = sf.info(output_wav_path)
                return info.duration, info.samplerate

            except Exception as e:
                print(f"[F5TTSService] Inference failed: {e}")
                # Clear CUDA cache if VRAM was an issue
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                raise e

    def cleanup(self):
        """Cleans up model resources and clears VRAM."""
        with self._lock:
            self._model = None
            self._model_status = "unloaded"
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()

f5_tts_service = F5TTSService()

