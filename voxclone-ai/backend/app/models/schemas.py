from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class VoiceUploadResponse(BaseModel):
    id: str
    name: str
    file_path: str
    duration_seconds: float
    sample_rate: int
    consent_confirmed: bool
    transcription: Optional[str] = None
    created_at: str

class VoiceUpdateRequest(BaseModel):
    name: Optional[str] = None
    transcription: Optional[str] = None

class TranscribeRequest(BaseModel):
    manual_transcription: Optional[str] = None

class TranscribeResponse(BaseModel):
    transcription: str

class GenerationCreateRequest(BaseModel):
    target_text: str = Field(..., min_length=1, max_length=2000)
    ref_text: Optional[str] = None
    nfe_steps: Optional[int] = Field(default=32, ge=8, le=64)
    speed: Optional[float] = Field(default=1.0, ge=0.5, le=2.0)
    cfg_strength: Optional[float] = Field(default=2.0, ge=0.5, le=5.0)

class GenerationResponse(BaseModel):
    generation_id: str
    audio_url: str
    status: str

class GenerationRecordSchema(BaseModel):
    id: str
    voice_id: str
    voice_name: Optional[str] = None
    input_text: str
    ref_text: str
    output_file_path: Optional[str] = None
    duration_seconds: Optional[float] = None
    status: str
    error_message: Optional[str] = None
    device_used: Optional[str] = None
    nfe_steps: Optional[int] = None
    speed: Optional[float] = None
    cfg_strength: Optional[float] = None
    created_at: str

class HealthResponse(BaseModel):
    status: str
    model_status: str
    model_loaded: bool
    device: str
    cuda_available: bool
    gpu_name: Optional[str] = None
    vram_allocated_mb: Optional[float] = None
    vram_total_mb: Optional[float] = None

