import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Play, Pause, RotateCcw, Sparkles, Check, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { VoiceRecord } from '../types';

interface VoiceRecorderProps {
  onVoiceReady: (voice: VoiceRecord) => void;
  selectedVoice: VoiceRecord | null;
  activeLanguage?: 'en' | 'kn';
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onVoiceReady, selectedVoice, activeLanguage = 'en' }) => {
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(true);
  const [voiceName, setVoiceName] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (selectedVoice) {
      setVoiceName(selectedVoice.name);
      setTranscription(selectedVoice.transcription || '');
      setPreviewUrl(api.getVoiceAudioUrl(selectedVoice.id));
      setRecordedBlob(null);
    }
  }, [selectedVoice]);

  // Draw idle ambient waveform when not recording
  useEffect(() => {
    if (!isRecording) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let step = 0;
      let idleAnim: number;

      const drawIdle = () => {
        idleAnim = requestAnimationFrame(drawIdle);
        step += 0.04;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bars = 36;
        const barWidth = canvas.width / bars - 2;

        for (let i = 0; i < bars; i++) {
          const height = 4 + Math.sin(step + i * 0.3) * 6 + 6;
          const x = i * (barWidth + 2);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
          ctx.fillRect(x, canvas.height / 2 - height / 2, barWidth, height);
        }
      };

      drawIdle();

      return () => cancelAnimationFrame(idleAnim);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  const startVisualizer = (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.6;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = Math.max(3, (dataArray[i] / 255) * canvas.height);
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth + 1;
        }
      };

      draw();
    } catch (e) {
      console.warn("Visualizer failed", e);
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setRecordedBlob(null);
    setPreviewUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startVisualizer(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);

        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser.");
      } else {
        setErrorMessage(`Recording error: ${err.message || 'Microphone not detected.'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setRecordedBlob(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (!voiceName) {
      setVoiceName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().then(() => setIsPlayingPreview(true)).catch(() => {});
    }
  };

  const handleSaveAndProcessVoice = async () => {
    if (!recordedBlob && !selectedVoice) {
      setErrorMessage("Please record or select reference audio first.");
      return;
    }

    if (!consentConfirmed) {
      setErrorMessage("You must confirm voice authorization/consent before proceeding.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      let activeVoice: VoiceRecord;

      if (recordedBlob) {
        activeVoice = await api.uploadVoice(
          recordedBlob,
          voiceName || 'My Voice Sample',
          consentConfirmed
        );
      } else if (selectedVoice) {
        activeVoice = selectedVoice;
      } else {
        throw new Error("No audio available");
      }

      if (transcription.trim() && transcription !== activeVoice.transcription) {
        activeVoice = await api.updateVoice(activeVoice.id, { transcription: transcription.trim() });
      }

      onVoiceReady(activeVoice);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process voice sample.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAutoTranscribe = async () => {
    if (!selectedVoice && !recordedBlob) {
      setErrorMessage("Please record audio or upload a voice first.");
      return;
    }

    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      let voiceId = selectedVoice?.id;
      if (!voiceId && recordedBlob) {
        const uploaded = await api.uploadVoice(
          recordedBlob,
          voiceName || 'Recorded Sample',
          consentConfirmed
        );
        voiceId = uploaded.id;
        onVoiceReady(uploaded);
      }

      if (voiceId) {
        const langHint = activeLanguage === 'kn' ? 'kn' : undefined;
        const res = await api.transcribeVoice(voiceId, undefined, langHint);
        setTranscription(res.transcription);
      }
    } catch (err: any) {
      setErrorMessage(`Transcription failed: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Source Switcher Card */}
      <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Reference Audio Source</h2>
          </div>

          <div className="flex p-0.5 rounded-lg bg-surface-300 border border-slate-800 text-xs">
            <button
              onClick={() => setMode('record')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                mode === 'record'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record Mic</span>
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                mode === 'upload'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Visualizer Container */}
        {mode === 'record' ? (
          <div className="rounded-xl bg-surface-300 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-medium">
                <span className={`w-2 h-2 rounded-full bg-rose-500 ${isRecording ? 'animate-ping' : ''}`} />
                <span>{isRecording ? 'RECORDING' : 'STANDBY'}</span>
                <span className="text-white font-mono tabular-nums ml-2 text-xs">{formatSecs(recordingDuration)}</span>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">24kHz Mono Resampled</div>
            </div>

            <canvas ref={canvasRef} width="360" height="52" className="w-full h-14 rounded-lg bg-slate-950/70" />

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Browser Audio Stream Active
              </span>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Recording</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Upload Mode */
          <div className="rounded-xl bg-surface-300 border border-dashed border-slate-700 p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-surface-200 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <label className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                <span>Click to select audio file</span>
                <input
                  type="file"
                  accept="audio/*,.wav,.mp3,.ogg,.m4a,.webm,.flac"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">Supports WAV, MP3, WebM, OGG, FLAC (5–15 seconds recommended)</p>
            </div>
          </div>
        )}

        {/* Audio Preview Transport */}
        {previewUrl && (
          <div className="p-3.5 rounded-xl bg-surface-300 border border-slate-800 flex items-center justify-between">
            <audio
              ref={previewAudioRef}
              src={previewUrl}
              onEnded={() => setIsPlayingPreview(false)}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={togglePreviewPlay}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition active:scale-95"
              >
                {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <div>
                <span className="text-xs font-medium text-slate-200">
                  {voiceName || (selectedVoice ? selectedVoice.name : "Recorded Reference")}
                </span>
                <p className="font-mono text-[10px] text-slate-400">
                  {selectedVoice ? `${selectedVoice.duration_seconds.toFixed(1)}s` : 'Captured audio ready'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRecordedBlob(null);
                  setPreviewUrl(null);
                  setRecordingDuration(0);
                }}
                className="p-1.5 rounded text-slate-400 hover:text-white transition"
                title="Reset reference"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reference Transcript Conditioning */}
      <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-200">Reference Transcript Conditioning</h3>
          </div>
          <button
            onClick={handleAutoTranscribe}
            disabled={isTranscribing || (!recordedBlob && !selectedVoice)}
            className="px-2.5 py-1 rounded-md bg-surface-300 hover:bg-surface-200 border border-slate-700/80 text-indigo-300 hover:text-white text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isTranscribing ? 'Transcribing with Whisper...' : 'Auto-Transcribe'}</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder={
            activeLanguage === 'kn'
              ? "ರೆಫರೆನ್ಸ್ ಆಡಿಯೋದಲ್ಲಿ ಮಾತನಾಡಿದ ನಿಖರವಾದ ಕನ್ನಡ ಮಾತುಗಳು (ಉದಾ: ನಮಸ್ಕಾರ, ಇದು ನನ್ನ ಧ್ವನಿ)..."
              : "The exact words spoken in the reference audio (improves synthesis accuracy)..."
          }
          className="w-full bg-surface-300 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none resize-none leading-relaxed transition"
        />
        <p className="text-[11px] text-slate-400">
          Conditioning on exact reference words aligns phoneme durations and prevents vocal artifacts.
        </p>
      </div>

      {/* Mandatory Legal Consent Card */}
      <div className="p-4 rounded-xl bg-surface-100 border border-slate-800 space-y-2 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => setConsentConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
          />
          <span className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-slate-100 font-semibold">Authorized Consent: </strong>
            I verify this is my own voice or I possess explicit written authorization to clone and condition this voice model for speech synthesis.
          </span>
        </label>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1 pl-7">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local processing only · Synthetic attribution metadata recorded</span>
        </div>
      </div>

      {/* Full-width Action: Confirm Reference Voice */}
      <button
        onClick={handleSaveAndProcessVoice}
        disabled={isUploading || (!recordedBlob && !selectedVoice)}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
      >
        <Check className="w-4 h-4 text-white" />
        <span>{isUploading ? 'Validating Audio with FFmpeg...' : 'Confirm Reference Voice'}</span>
      </button>
    </div>
  );
};
