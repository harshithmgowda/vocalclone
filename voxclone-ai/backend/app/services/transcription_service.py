import os
from pathlib import Path
from typing import Optional

class TranscriptionService:
    def __init__(self):
        self._whisper_model = None

    def get_whisper_model(self):
        if self._whisper_model is None:
            try:
                from faster_whisper import WhisperModel
                # Use tiny or base for instant transcription
                print("[TranscriptionService] Loading Whisper 'base' model...")
                self._whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            except Exception as e:
                print(f"[TranscriptionService] Faster-whisper init failed: {e}")
                self._whisper_model = None
        return self._whisper_model

    def transcribe_audio(self, audio_path: str, language: Optional[str] = None) -> str:
        """
        Transcribes reference audio into text.
        """
        model = self.get_whisper_model()
        if model is not None:
            try:
                segments, info = model.transcribe(audio_path, language=language, beam_size=5)
                text = " ".join([seg.text.strip() for seg in segments]).strip()
                if text:
                    return text
            except Exception as e:
                print(f"[TranscriptionService] Error during whisper transcribe: {e}")

        # Fallback to F5-TTS built-in transcribe
        try:
            from f5_tts.api import F5TTS
            tts = F5TTS(device="cpu")
            return tts.transcribe(audio_path, language=language)
        except Exception as e:
            print(f"[TranscriptionService] Fallback transcribe failed: {e}")
            return ""

transcription_service = TranscriptionService()

