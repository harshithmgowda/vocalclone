import { VoiceRecord, GenerationRecord, HealthStatus, GenerationRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl = API_BASE_URL;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
        },
      });

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.message || errorMsg;
        } catch {
          // fallback to status text
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(`Cannot connect to VoxClone backend at ${this.baseUrl}. Please verify the server is running.`);
      }
      throw err;
    }
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/health');
  }

  async getModelStatus(): Promise<{ model_status: string; device: string; is_ready: boolean; details?: any }> {
    return this.request('/api/model/status');
  }

  async uploadVoice(audioBlob: Blob, name: string, consentConfirmed: boolean): Promise<VoiceRecord> {
    const formData = new FormData();
    const filename = audioBlob instanceof File 
      ? audioBlob.name 
      : (audioBlob.type.includes('wav') ? 'reference_voice.wav' : 'reference_voice.webm');
    formData.append('file', audioBlob, filename);
    formData.append('name', name);
    formData.append('consent_confirmed', String(consentConfirmed));

    const response = await fetch(`${this.baseUrl}/api/voice/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to upload voice' }));
      throw new Error(err.detail || 'Voice upload failed');
    }

    return response.json();
  }

  async transcribeVoice(voiceId: string, manualTranscription?: string, language?: string): Promise<{ transcription: string }> {
    return this.request<{ transcription: string }>(`/api/voice/${voiceId}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ manual_transcription: manualTranscription, language: language }),
    });
  }

  async generateSpeech(voiceId: string, request: GenerationRequest): Promise<{ generation_id: string; audio_url: string; status: string }> {
    return this.request(`/api/voice/${voiceId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  }

  async getGenerationStatus(generationId: string): Promise<GenerationRecord> {
    return this.request<GenerationRecord>(`/api/generation/${generationId}/status`);
  }

  getAudioUrl(generationId: string): string {
    return `${this.baseUrl}/api/audio/${generationId}?t=${Date.now()}`;
  }

  getVoiceAudioUrl(voiceId: string): string {
    return `${this.baseUrl}/api/voice/${voiceId}/audio?t=${Date.now()}`;
  }

  async getVoices(): Promise<VoiceRecord[]> {
    return this.request<VoiceRecord[]>('/api/voices');
  }

  async updateVoice(voiceId: string, updates: { name?: string; transcription?: string }): Promise<VoiceRecord> {
    return this.request<VoiceRecord>(`/api/voices/${voiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  async deleteVoice(voiceId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/voices/${voiceId}`, {
      method: 'DELETE',
    });
  }

  async getHistory(): Promise<GenerationRecord[]> {
    return this.request<GenerationRecord[]>('/api/history');
  }

  async deleteHistory(generationId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/history/${generationId}`, {
      method: 'DELETE',
    });
  }

  async cleanupTemporary(): Promise<{ deleted_count: number; message: string }> {
    return this.request('/api/settings/cleanup', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();

