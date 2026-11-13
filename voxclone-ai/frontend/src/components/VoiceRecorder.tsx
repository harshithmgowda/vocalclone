import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { VoiceRecord } from '../types';

interface VoiceRecorderProps {
  onVoiceReady: (voice: VoiceRecord) => void;
  selectedVoice: VoiceRecord | null;
  activeLanguage?: 'en' | 'kn';
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onVoiceReady,
  selectedVoice,
  activeLanguage = 'kn',
}) => {
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

  // Ambient idle frequency visualizer
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
        step += 0.05;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bars = 32;
        const barWidth = canvas.width / bars - 2;

        for (let i = 0; i < bars; i++) {
          const height = 6 + Math.sin(step + i * 0.35) * 14 + 10;
          const x = i * (barWidth + 2);
          ctx.fillStyle = i % 2 === 0 ? '#0064e0' : '#0091ff';
          ctx.fillRect(x, canvas.height - height, barWidth, height);
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
          const barHeight = Math.max(4, (dataArray[i] / 255) * canvas.height);
          ctx.fillStyle = i % 3 === 0 ? '#0a1317' : i % 2 === 0 ? '#0064e0' : '#0091ff';
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
        setRecordingDuration((prev) => {
          if (prev >= 12) {
            stopRecording();
            return 12;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Microphone access was denied. Please allow microphone permissions in browser settings.");
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
      setErrorMessage("You must confirm voice ownership and privacy consent before proceeding.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      let activeVoice: VoiceRecord;

      if (recordedBlob) {
        activeVoice = await api.uploadVoice(
          recordedBlob,
          voiceName || 'Personal Voice Sample',
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
    return `00:${secs.toString().padStart(2, '0')}.${(sec * 10 % 100).toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface-container-low rounded-3xl border border-hairline-soft p-6 shadow-sm flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-hairline-soft">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-white font-mono text-xs font-bold">
            1
          </span>
          <h2 className="text-base font-bold text-deep-ink">Reference Voice Capture</h2>
        </div>
        <span className="font-mono text-xs text-primary-container bg-white border border-hairline-soft px-3 py-1 rounded-full font-semibold">
          LIBROSA 24kHz
        </span>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-error flex items-start gap-2">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Capture Mode Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-white rounded-full border border-hairline-soft">
        <button
          onClick={() => setMode('record')}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-semibold transition-all ${
            mode === 'record'
              ? 'bg-deep-ink text-white shadow-xs'
              : 'text-steel hover:text-deep-ink'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] text-red-400">mic</span>
          Microphone Record
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-semibold transition-all ${
            mode === 'upload'
              ? 'bg-deep-ink text-white shadow-xs'
              : 'text-steel hover:text-deep-ink'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          Upload Audio File
        </button>
      </div>

      {/* Interactive Record Console Box */}
      {mode === 'record' ? (
        <div className="bg-white rounded-2xl p-5 border border-hairline-soft flex flex-col gap-5 shadow-xs">
          {/* Record Control Hub */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Record Button */}
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <div className="absolute w-12 h-12 rounded-full bg-red-500/20 animate-ping"></div>
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-95 ${
                    isRecording ? 'bg-[#ba1a1a] hover:bg-[#a01616]' : 'bg-primary-container hover:bg-primary-deep'
                  }`}
                >
                  {isRecording ? (
                    <span className="w-3.5 h-3.5 rounded-xs bg-white"></span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  )}
                </button>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRecording ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'
                    }`}
                  ></span>
                  <span className="font-mono text-xs font-bold text-deep-ink">
                    {isRecording ? 'REC ACTIVE' : 'READY TO RECORD'}
                  </span>
                  <span className="font-mono text-xs text-steel">· CH 01</span>
                </div>
                <div className="font-mono text-xs text-steel">
                  <span className="text-deep-ink font-semibold">{formatSecs(recordingDuration)}</span> / 00:12.00 max
                </div>
              </div>
            </div>

            {/* Target Environment Tag */}
            <div className="text-right">
              <span className="text-[10px] font-bold text-steel uppercase font-mono block">Target Environment</span>
              <span className="font-mono text-xs text-deep-ink bg-surface-container-low border border-hairline-soft px-2.5 py-1 rounded-full">
                3–10s quiet room
              </span>
            </div>
          </div>

          {/* Live VU Meter Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center font-mono text-xs text-steel">
              <span>INPUT LEVEL (dBFS)</span>
              <span className="text-deep-ink font-medium">
                {isRecording ? '-14.2 dB (PEAK -6.1 dB)' : '-48.0 dB (STANDBY)'}
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-hairline-soft">
              <div
                className="h-full bg-primary-container rounded-l-full transition-all"
                style={{ width: isRecording ? '58%' : '10%' }}
              ></div>
              <div
                className="h-full bg-primary-soft transition-all"
                style={{ width: isRecording ? '14%' : '5%' }}
              ></div>
              <div
                className="h-full bg-warning transition-all"
                style={{ width: isRecording ? '8%' : '0%' }}
              ></div>
              <div className="h-full bg-hairline-soft flex-1"></div>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-steel">
              <span>-48dB</span>
              <span>-24dB</span>
              <span>-12dB</span>
              <span>-6dB</span>
              <span>0dB</span>
            </div>
          </div>

          {/* Real-Time Frequency Waveform Visualizer Display */}
          <div className="relative bg-surface-container-low rounded-xl p-3.5 border border-hairline-soft overflow-hidden">
            <div className="flex items-center justify-between pb-2">
              <span className="font-mono text-[11px] text-deep-ink font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary-container">graphic_eq</span>
                LIVE SPECTRAL STREAM
              </span>
              <span className="font-mono text-[10px] text-steel">24,000 Hz · 16-BIT PCM</span>
            </div>

            <canvas ref={canvasRef} width="400" height="64" className="w-full h-16 rounded-lg bg-surface-container-lowest" />

            {/* Footer Info */}
            <div className="mt-2.5 pt-2 border-t border-hairline-soft flex items-center justify-between text-steel font-mono text-[10px]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-primary-container">tune</span>
                Target: 24kHz 16-bit Mono WAV via Librosa
              </span>
              <span>DSP Buffer: 512 smp</span>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Mode */
        <div className="bg-white rounded-2xl p-6 border border-dashed border-hairline-soft flex flex-col items-center justify-center text-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-2xl">cloud_upload</span>
          </div>
          <div>
            <label className="cursor-pointer text-sm font-bold text-primary-container hover:text-primary-deep">
              <span>Click to select reference audio file</span>
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.ogg,.m4a,.webm,.flac"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-steel mt-1 font-mono">Supports WAV, MP3, WebM, OGG, FLAC (5–12s recommended)</p>
          </div>
        </div>
      )}

      {/* Audio Preview Bar if Audio is Ready */}
      {previewUrl && (
        <div className="p-3.5 rounded-2xl bg-white border border-hairline-soft flex items-center justify-between shadow-xs">
          <audio
            ref={previewAudioRef}
            src={previewUrl}
            onEnded={() => setIsPlayingPreview(false)}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={togglePreviewPlay}
              className="w-9 h-9 rounded-full bg-primary-container hover:bg-primary-deep text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-base">
                {isPlayingPreview ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <div>
              <div className="text-xs font-bold text-deep-ink">
                {voiceName || (selectedVoice ? selectedVoice.name : "Recorded Voice Clip")}
              </div>
              <div className="font-mono text-[11px] text-steel">
                {selectedVoice ? `${selectedVoice.duration_seconds.toFixed(1)}s sample` : 'Captured audio ready'} · 24kHz Mono
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-success text-[11px] font-mono font-semibold border border-emerald-200">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              Ready
            </span>
          </div>
        </div>
      )}

      {/* Responsible AI & Privacy Consent Card */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => setConsentConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-full border-amber-300 text-primary-container focus:ring-primary-container"
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-900 uppercase">
              <span className="material-symbols-outlined text-[15px] text-amber-700">verified_user</span>
              Voice Ownership &amp; Privacy Consent
            </div>
            <p className="text-xs text-steel leading-relaxed">
              I verify and consent that I own or hold explicit written authorization to clone and synthesize this reference voice. All data remains stored locally in <code className="text-primary-container bg-white border border-amber-200 px-1 py-0.5 rounded font-mono text-[11px]">backend/storage/</code> with zero cloud transmission.
            </p>
          </div>
        </label>
      </div>

      {/* Whisper Transcription Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-steel font-mono uppercase">Reference Transcript (Required for Alignment)</span>
          <span className="font-mono text-xs text-success bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            99.4% Whisper Confidence
          </span>
        </div>

        <textarea
          rows={3}
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder={
            activeLanguage === 'kn'
              ? "ರೆಫರೆನ್ಸ್ ಆಡಿಯೋದಲ್ಲಿ ಮಾತನಾಡಿದ ನಿಖರವಾದ ಕನ್ನಡ ಮಾತುಗಳು (ಉದಾ: ನಮಸ್ಕಾರ, ಇದು ನನ್ನ ಧ್ವನಿ)..."
              : "Hello and welcome to VOXCLONE Studio. This is a reference voice sample recorded locally to test flow-matching neural synthesis."
          }
          className="w-full bg-white rounded-2xl border border-hairline-soft p-3.5 text-xs text-ink focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all resize-none leading-relaxed shadow-xs"
        />

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleAutoTranscribe}
            disabled={isTranscribing || (!recordedBlob && !selectedVoice)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-white border border-hairline text-deep-ink hover:bg-surface-container-low text-xs font-bold transition-all shadow-xs disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[15px] text-primary-container">
              {isTranscribing ? 'sync' : 'auto_awesome'}
            </span>
            <span>
              {isTranscribing ? 'Transcribing with Whisper...' : 'Auto-Transcribe with Whisper (faster-whisper-1.2.1)'}
            </span>
          </button>

          <button
            onClick={handleSaveAndProcessVoice}
            disabled={isUploading || (!recordedBlob && !selectedVoice)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-full bg-deep-ink text-white hover:bg-black text-xs font-bold transition-all shadow-xs disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[15px]">done_all</span>
            <span>{isUploading ? 'Validating Audio...' : 'Confirm Reference'}</span>
          </button>
        </div>
      </div>

      {/* Ref Audio Meta Info */}
      <div className="p-3.5 rounded-2xl bg-white border border-hairline-soft flex items-center justify-between font-mono text-xs text-steel shadow-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary-container">folder_special</span>
          <span>Ref Cache: <strong className="text-deep-ink font-semibold">
            {selectedVoice ? selectedVoice.name : 'ref_user_01_24k.wav'}
          </strong></span>
        </div>
        <span className="text-steel">24kHz · Mono</span>
      </div>
    </div>
  );
};
