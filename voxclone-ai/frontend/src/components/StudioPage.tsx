import React, { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioPlayer } from './AudioPlayer';
import { VoiceRecord } from '../types';
import { api } from '../services/api';
import { Sliders, Zap, AlertCircle, RefreshCw, AudioWaveform, Languages, Sparkles } from 'lucide-react';
import { isKannada, kannadaToPhonetic, KANNADA_PRESETS, ENGLISH_PRESETS } from '../utils/kannada';

interface StudioPageProps {
  voices: VoiceRecord[];
  onVoiceCreated: () => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ voices, onVoiceCreated }) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceRecord | null>(voices[0] || null);
  const [language, setLanguage] = useState<'en' | 'kn'>('kn');
  const [targetText, setTargetText] = useState(
    "ನಮಸ್ಕಾರ! ವೋಕ್ಸ್‌ಕ್ಲೋನ್ ಎಐಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮದೇ ಧ್ವನಿಯಲ್ಲಿ ಯಾವುದೇ ವಾಕ್ಯವನ್ನು ಮಾತನಾಡಿ."
  );
  const [nfeSteps, setNfeSteps] = useState(32);
  const [speed, setSpeed] = useState(1.0);
  const [cfgStrength, setCfgStrength] = useState(2.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [denoiseActive, setDenoiseActive] = useState(true);

  const activePresets = language === 'kn' ? KANNADA_PRESETS : ENGLISH_PRESETS;
  const isInputKannada = isKannada(targetText);
  const phoneticPreview = isInputKannada ? kannadaToPhonetic(targetText) : null;

  const handleLanguageSwitch = (lang: 'en' | 'kn') => {
    setLanguage(lang);
    if (lang === 'kn') {
      setTargetText("ನಮಸ್ಕಾರ! ವೋಕ್ಸ್‌ಕ್ಲೋನ್ ಎಐಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮದೇ ಧ್ವನಿಯಲ್ಲಿ ಯಾವುದೇ ವಾಕ್ಯವನ್ನು ಮಾತನಾಡಿ.");
    } else {
      setTargetText("Welcome to VoxClone AI. Your neural voice model is ready to speak with authentic cadence and timbre.");
    }
  };

  const handleVoiceReady = (voice: VoiceRecord) => {
    setSelectedVoice(voice);
    onVoiceCreated();
  };

  const handleConvertKannadaToLatin = () => {
    if (phoneticPreview) {
      setTargetText(phoneticPreview);
    }
  };

  const handleGenerate = async () => {
    if (!selectedVoice) {
      setErrorMessage("Please select or record a reference voice first.");
      return;
    }

    if (!targetText.trim()) {
      setErrorMessage("Please enter text for the AI to speak.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await api.generateSpeech(selectedVoice.id, {
        target_text: targetText.trim(),
        ref_text: selectedVoice.transcription || '',
        nfe_steps: nfeSteps,
        speed: speed,
        cfg_strength: cfgStrength,
      });

      const audioUrl = api.getAudioUrl(res.generation_id);
      setGeneratedAudioUrl(audioUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate speech. Please check backend logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUMN 1: REFERENCE VOICE */}
        <div className="space-y-4">
          {voices.length > 0 && (
            <div className="p-3.5 rounded-xl bg-surface-100 border border-slate-800 flex items-center justify-between shadow-sm">
              <span className="text-xs text-slate-300 font-medium">Active Reference Profile:</span>
              <select
                value={selectedVoice?.id || ''}
                onChange={(e) => {
                  const v = voices.find((item) => item.id === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
                className="bg-surface-300 text-xs text-slate-100 font-medium border border-slate-700/80 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[240px] truncate"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.duration_seconds.toFixed(1)}s)
                  </option>
                ))}
              </select>
            </div>
          )}

          <VoiceRecorder
            onVoiceReady={handleVoiceReady}
            selectedVoice={selectedVoice}
            activeLanguage={language}
          />
        </div>

        {/* COLUMN 2: SPEECH SYNTHESIS */}
        <div className="space-y-4">
          {/* Target Speech Prompt Container */}
          <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-3.5 shadow-sm">
            {/* Header with Language Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AudioWaveform className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-100">Target Speech Script</h2>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-surface-300 border border-slate-800 text-xs">
                <button
                  onClick={() => handleLanguageSwitch('kn')}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                    language === 'kn'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>ಕನ್ನಡ (KN)</span>
                </button>
                <button
                  onClick={() => handleLanguageSwitch('en')}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                    language === 'en'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>English (EN)</span>
                </button>
              </div>
            </div>

            {/* Clean, high-legibility Textarea */}
            <textarea
              rows={5}
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              className="w-full bg-surface-300 border border-slate-800 rounded-xl p-3.5 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none resize-none leading-relaxed transition"
              placeholder={
                language === 'kn'
                  ? "ಇಲ್ಲಿ ಕನ್ನಡದಲ್ಲಿ ಪಠ್ಯವನ್ನು ಟೈಪ್ ಮಾಡಿ (ಉದಾ: ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಾ?)..."
                  : "Enter text for speech synthesis..."
              }
            />

            {/* Real-time Kannada Phonetics Indicator */}
            {isInputKannada && phoneticPreview && (
              <div className="p-3 rounded-xl bg-surface-300 border border-slate-700/70 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Neural Phonetic Alignment:
                  </span>
                  <button
                    onClick={handleConvertKannadaToLatin}
                    className="text-[10px] text-slate-400 hover:text-white underline transition"
                    title="Replace input with phonetic Latin text"
                  >
                    Use Romanized Script
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-300 leading-normal line-clamp-2">
                  {phoneticPreview}
                </p>
              </div>
            )}

            {/* Cadence Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {language === 'kn' ? 'ಕನ್ನಡ ಮಾದರಿಗಳು (Presets):' : 'Script Presets:'}
                </span>
                <span className="tabular-nums font-mono text-[11px] text-slate-400">
                  <span className="text-indigo-400 font-semibold">{targetText.length}</span> / 2000 chars
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activePresets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setTargetText(preset.text)}
                    className="px-2.5 py-1 rounded-md bg-surface-200 hover:bg-surface-300 border border-slate-800 text-slate-300 hover:text-white text-xs transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flow Matching Parameters */}
          <div className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-300" />
                <span className="text-xs text-slate-200 font-semibold">Synthesis Parameters</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">F5-TTS Architecture</span>
            </div>

            {/* Slider 1: NFE Steps */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">NFE Steps (Sampling Iterations)</span>
                <span className="font-mono px-2 py-0.5 rounded bg-surface-300 text-indigo-300 border border-slate-700/60 tabular-nums text-[11px]">
                  {nfeSteps}
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="64"
                step="4"
                value={nfeSteps}
                onChange={(e) => setNfeSteps(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>16 (Fast draft)</span>
                <span>32 (Balanced)</span>
                <span>64 (Studio Master)</span>
              </div>
            </div>

            {/* Slider 2: Speaking Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Speaking Speed</span>
                <span className="font-mono px-2 py-0.5 rounded bg-surface-300 text-slate-200 border border-slate-700/60 tabular-nums text-[11px]">
                  {speed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>2.0x Accelerated</span>
              </div>
            </div>

            {/* Slider 3: CFG Guidance */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">CFG Guidance (Acoustic Fidelity)</span>
                <span className="font-mono px-2 py-0.5 rounded bg-surface-300 text-slate-200 border border-slate-700/60 tabular-nums text-[11px]">
                  {cfgStrength.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.2"
                value={cfgStrength}
                onChange={(e) => setCfgStrength(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>1.0 Relaxed</span>
                <span>2.0 Reference Clamped</span>
                <span>5.0 Maximum Rigid</span>
              </div>
            </div>

            {/* Toggle: Neural De-noising */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-slate-200">Neural Ambient De-noising</div>
                <div className="text-[11px] text-slate-400">Filter room reverberation and microphone hiss</div>
              </div>
              <div
                onClick={() => setDenoiseActive(!denoiseActive)}
                className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex items-center transition-colors ${
                  denoiseActive ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>

          {/* Primary High-Craft Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedVoice}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition active:scale-[0.99] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>
                  {language === 'kn' ? 'ಧ್ವನಿ ಸೃಷ್ಟಿ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ (Generating Kannada Speech)...' : 'Generating Speech with Cloned Voice...'}
                </span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>
                  {language === 'kn' ? 'Generate Cloned Kannada Speech (ಧ್ವನಿ ಸೃಷ್ಟಿಸಿ)' : 'Generate Cloned Speech'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-700 text-indigo-100 border border-indigo-500/40 tabular-nums">
                  RTF ~0.35x
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
            <span>Inference accelerated by local NVIDIA RTX 5050 GPU</span>
          </div>
        </div>
      </div>

      {/* Bottom Dock: Generated Audio Player */}
      {generatedAudioUrl && (
        <div className="fixed bottom-0 right-0 left-64 bg-surface-200 border-t border-slate-800 px-6 py-3.5 z-30 shadow-xl">
          <AudioPlayer
            src={generatedAudioUrl}
            title={selectedVoice ? `${selectedVoice.name} · Output` : "Generated Audio Output"}
            autoPlay={true}
            onDelete={() => setGeneratedAudioUrl(null)}
          />
        </div>
      )}
    </div>
  );
};
