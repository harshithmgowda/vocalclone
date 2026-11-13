import React from 'react';
import { Radio, Sparkles, ShieldCheck, Cpu } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-8 rounded-2xl bg-surface-100 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">VOXCLONE AI</h2>
            <p className="text-xs text-slate-400">Your Voice. Your AI. Your Words.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          VOXCLONE AI is an autonomous, production-grade personal AI voice cloning studio powered by the state-of-the-art <strong>F5-TTS</strong> non-autoregressive flow-matching speech synthesis model. It enables users to record or upload verified reference voice samples, match acoustic timbre, and synthesize natural conversational speech.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>F5-TTS Flow Matching</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Unlike slow autoregressive TTS models, F5-TTS uses continuous normalizing flows and optimal transport vector fields with ConvNeXt-V2 backbones, allowing natural cadence, rhythm, and intonation conditioning in a fraction of real-time.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Hardware Acceleration</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Optimized for NVIDIA GeForce RTX GPUs with native CUDA acceleration and Blackwell compute capability, delivering high-speed low-latency neural synthesis locally.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Responsible Voice Ethics</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            VoxClone AI enforces mandatory user consent verification before any voice sample is processed. All synthesized audio is intended for creative, accessibility, and authorized personal workflows.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
            <Radio className="w-4 h-4" />
            <span>ಕನ್ನಡ & Multilingual Flow</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Full support for Kannada (ಕನ್ನಡ) voice synthesis with automatic phoneme transliteration from native Kannada script to acoustic flow vectors, plus Faster-Whisper Kannada auto-transcription.
          </p>
        </div>
      </div>
    </div>
  );
};
