export interface VoiceRecord {
  id: string;
  name: string;
  file_path: string;
  duration_seconds: number;
  sample_rate: number;
  consent_confirmed: boolean;
  transcription?: string;
  created_at: string;
}

export interface GenerationRecord {
  id: string;
  voice_id: string;
  voice_name?: string;
  input_text: string;
  ref_text: string;
  output_file_path?: string;
  duration_seconds?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  device_used?: string;
  nfe_steps?: number;
  speed?: number;
  cfg_strength?: number;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  model_status: 'unloaded' | 'loading' | 'ready' | 'error';
  model_loaded: boolean;
  device: string;
  cuda_available: boolean;
  gpu_name?: string;
  vram_allocated_mb?: number;
  vram_total_mb?: number;
}

export interface GenerationRequest {
  target_text: string;
  ref_text: string;
  nfe_steps?: number;
  speed?: number;
  cfg_strength?: number;
}

