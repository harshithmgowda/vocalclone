import React, { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioPlayer } from './AudioPlayer';
import { VoiceRecord, GenerationRecord } from '../types';
import { api } from '../services/api';
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
  const [nfeSteps, setNfeSteps] = useState(24);
  const [speed, setSpeed] = useState(0.9);
  const [cfgStrength, setCfgStrength] = useState(2.2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generationRecord, setGenerationRecord] = useState<GenerationRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePresets = language === 'kn' ? KANNADA_PRESETS : ENGLISH_PRESETS;
  const isInputKannada = isKannada(targetText);
  const phoneticPreview = isInputKannada ? kannadaToPhonetic(targetText) : null;

  const handleLanguageSwitch = (lang: 'en' | 'kn') => {
    setLanguage(lang);
    if (lang === 'kn') {
      setTargetText("ನಮಸ್ಕಾರ! ವೋಕ್ಸ್‌ಕ್ಲೋನ್ ಎಐಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮದೇ ಧ್ವನಿಯಲ್ಲಿ ಯಾವುದೇ ವಾಕ್ಯವನ್ನು ಮಾತನಾಡಿ.");
    } else {
      setTargetText(
        "Welcome to the next generation of local speech synthesis. By combining F5-TTS non-autoregressive flow matching with the Vocos mel-vocoder on our NVIDIA RTX 5050 GPU, speech is generated with natural prosody and zero cloud latency."
      );
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

      const record = await api.getGenerationStatus(res.generation_id);
      setGenerationRecord(record);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate speech. Please check backend logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col w-full text-ink">
      {/* SUB HEADER / COMMAND STRIP */}
      <div className="px-6 md:px-10 py-5 border-b border-hairline-soft bg-surface-container-low/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-deep-ink flex items-center gap-2">
                Voice Cloning Studio
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-primary-container border border-blue-200 font-mono text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                FLOW-MATCHING v1.2
              </span>
            </div>
            <p className="text-sm text-steel">
              Local neural flow-matching speech synthesis powered by F5-TTS &amp; Vocos Vocoder
            </p>
          </div>

          {/* Badges Strip */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-deep-ink border border-hairline-soft shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              <span>FastAPI (127.0.0.1:8000)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-primary-container border border-hairline-soft shadow-xs">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span>CUDA 12.8</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-steel border border-hairline-soft shadow-xs">
              <span className="material-symbols-outlined text-[14px]">code_blocks</span>
              <span>PyTorch 2.11.0</span>
            </div>
            <div className="hidden 2xl:flex items-center gap-1 px-3 py-1 rounded-full bg-white text-steel border border-hairline-soft shadow-xs">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Zero Cloud Egress</span>
            </div>
          </div>
        </div>
      </div>

      {/* STAGE WORKSPACE */}
      <div className="p-6 md:p-10 space-y-8">
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-error text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-steel hover:text-deep-ink font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: STEP 1 - REFERENCE CAPTURE */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Active Voice Selector */}
            {voices.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white border border-hairline-soft flex items-center justify-between shadow-xs">
                <span className="text-xs text-steel font-mono uppercase font-semibold">Active Profile:</span>
                <select
                  value={selectedVoice?.id || ''}
                  onChange={(e) => {
                    const v = voices.find((item) => item.id === e.target.value);
                    if (v) setSelectedVoice(v);
                  }}
                  className="bg-surface-container-low text-xs text-deep-ink font-semibold border border-hairline-soft rounded-full px-3 py-1.5 focus:outline-none focus:border-primary-container max-w-[220px] truncate"
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

          {/* RIGHT COLUMN: STEP 2 - SPEECH PROMPT & TUNING */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-surface-container-low rounded-3xl border border-hairline-soft p-6 shadow-sm flex flex-col gap-5">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-4 border-b border-hairline-soft">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-white font-mono text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-base font-bold text-deep-ink">Target Speech Synthesis &amp; Model Tuning</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary-container bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-semibold">
                    F5-TTS DiT
                  </span>
                  <span className="font-mono text-xs text-steel bg-white border border-hairline-soft px-3 py-1 rounded-full font-semibold">
                    VOCOS 24kHz
                  </span>
                </div>
              </div>

              {/* Language Switcher Bar */}
              <div className="flex items-center justify-between p-1.5 bg-white rounded-full border border-hairline-soft">
                <span className="text-xs font-bold text-steel font-mono uppercase pl-3">Synthesis Language:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleLanguageSwitch('kn')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      language === 'kn'
                        ? 'bg-primary-container text-white shadow-xs'
                        : 'text-steel hover:text-deep-ink'
                    }`}
                  >
                    ಕನ್ನಡ (KN)
                  </button>
                  <button
                    onClick={() => handleLanguageSwitch('en')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      language === 'en'
                        ? 'bg-primary-container text-white shadow-xs'
                        : 'text-steel hover:text-deep-ink'
                    }`}
                  >
                    English (EN)
                  </button>
                </div>
              </div>

              {/* Preset Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-xs text-steel">
                  <span className="font-bold uppercase">Target Prompt Presets</span>
                  <span>Click to apply demo</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activePresets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setTargetText(preset.text)}
                      className="px-3.5 py-1.5 rounded-full bg-white border border-hairline text-steel hover:text-deep-ink hover:bg-surface-container-low text-xs font-semibold shadow-xs transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-xs text-steel">
                  <label className="font-bold uppercase text-steel" htmlFor="target-prompt">
                    Text to Synthesize with Cloned Voice
                  </label>
                  <span>
                    <strong className="text-primary-container font-semibold">{targetText.length}</strong> / 1,000 chars
                  </span>
                </div>

                <div className="rounded-2xl bg-white border border-hairline-soft shadow-xs overflow-hidden focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container transition-all">
                  <textarea
                    id="target-prompt"
                    rows={5}
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    placeholder={
                      language === 'kn'
                        ? "ಇಲ್ಲಿ ಕನ್ನಡದಲ್ಲಿ ಪಠ್ಯವನ್ನು ಟೈಪ್ ಮಾಡಿ..."
                        : "Enter script to synthesize..."
                    }
                    className="w-full bg-transparent p-4 text-sm text-deep-ink leading-relaxed outline-none resize-none border-none focus:ring-0"
                  />
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-hairline-soft bg-surface-container-low/50">
                    <div className="flex items-center gap-3 text-steel font-mono text-[11px]">
                      <span>Est. Duration: ~{(targetText.length * 0.08).toFixed(1)}s</span>
                      <span>·</span>
                      <span>Tokens: ~{Math.round(targetText.length / 4)} tokens</span>
                    </div>
                    <button
                      onClick={() => setTargetText('')}
                      className="text-steel hover:text-deep-ink transition-colors p-1"
                      title="Clear text"
                    >
                      <span className="material-symbols-outlined text-[18px]">clear_all</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Kannada Neural Phonetics Alignment Notice */}
              {isInputKannada && phoneticPreview && (
                <div className="p-3.5 rounded-2xl bg-white border border-hairline-soft space-y-1.5 text-xs shadow-xs">
                  <div className="flex items-center justify-between text-steel">
                    <span className="flex items-center gap-1.5 font-bold text-primary-container font-mono uppercase text-[11px]">
                      <span className="material-symbols-outlined text-[14px]">translate</span>
                      Neural Phonetic Alignment:
                    </span>
                    <button
                      onClick={handleConvertKannadaToLatin}
                      className="font-mono text-[11px] text-steel hover:text-deep-ink underline"
                    >
                      Use Romanized Script
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-charcoal leading-relaxed line-clamp-2">
                    {phoneticPreview}
                  </p>
                </div>
              )}

              {/* MODEL TUNING PANEL */}
              <div className="rounded-2xl bg-white border border-hairline-soft p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[19px] text-primary-container">tune</span>
                    <span className="font-mono text-xs text-deep-ink uppercase font-bold">Neural Flow &amp; Vocoder Tuning</span>
                  </div>
                  <span className="font-mono text-xs text-steel">Euler ODE Solver</span>
                </div>

                {/* Precision Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Slider 1: NFE Steps */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-low border border-hairline-soft">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[11px] font-bold text-steel">NFE STEPS</span>
                      <span className="text-xs font-bold text-white bg-primary-container px-2 py-0.5 rounded-full">
                        {nfeSteps}
                      </span>
                    </div>
                    <input
                      className="w-full accent-primary-container h-1.5 bg-hairline-soft rounded-full cursor-pointer"
                      max="32"
                      min="16"
                      step="2"
                      type="range"
                      value={nfeSteps}
                      onChange={(e) => setNfeSteps(parseInt(e.target.value))}
                    />
                    <div className="flex justify-between font-mono text-[10px] text-steel">
                      <span>16 (Fast)</span>
                      <span>32 (Ultra)</span>
                    </div>
                    <p className="text-[11px] text-steel leading-tight">
                      Evaluations per flow step. 24 offers balanced latency.
                    </p>
                  </div>

                  {/* Slider 2: Speaking Pace */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-low border border-hairline-soft">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[11px] font-bold text-steel">SPEAKING PACE</span>
                      <span className="text-xs font-bold text-deep-ink bg-white border border-hairline-soft px-2 py-0.5 rounded-full">
                        {speed.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      className="w-full accent-primary-container h-1.5 bg-hairline-soft rounded-full cursor-pointer"
                      max="1.35"
                      min="0.65"
                      step="0.05"
                      type="range"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between font-mono text-[10px] text-steel">
                      <span>0.7x (Relaxed)</span>
                      <span>0.9x (Natural)</span>
                      <span>1.2x (Fast)</span>
                    </div>
                    <p className="text-[11px] text-steel leading-tight">
                      Adjusts phoneme duration scaling with Anti-Rush Cadence Guard.
                    </p>
                  </div>

                  {/* Slider 3: CFG Strength */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-low border border-hairline-soft">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[11px] font-bold text-steel">CFG STRENGTH</span>
                      <span className="text-xs font-bold text-deep-ink bg-white border border-hairline-soft px-2 py-0.5 rounded-full">
                        {cfgStrength.toFixed(1)}
                      </span>
                    </div>
                    <input
                      className="w-full accent-primary-container h-1.5 bg-hairline-soft rounded-full cursor-pointer"
                      max="5.0"
                      min="1.0"
                      step="0.2"
                      type="range"
                      value={cfgStrength}
                      onChange={(e) => setCfgStrength(parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between font-mono text-[10px] text-steel">
                      <span>1.0</span>
                      <span>5.0</span>
                    </div>
                    <p className="text-[11px] text-steel leading-tight">
                      Classifier-Free Guidance weight for reference fidelity.
                    </p>
                  </div>
                </div>

                {/* Toggles Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-hairline-soft">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-steel select-none">
                    <input
                      defaultChecked
                      className="h-4 w-4 rounded-full border-hairline text-primary-container focus:ring-primary-container"
                      type="checkbox"
                    />
                    <span>Remove silence via Librosa trim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-steel select-none">
                    <input
                      defaultChecked
                      className="h-4 w-4 rounded-full border-hairline text-primary-container focus:ring-primary-container"
                      type="checkbox"
                    />
                    <span>Anti-Rush Cadence Guard Active</span>
                  </label>
                  <span className="font-mono text-xs text-primary-container flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">memory</span>
                    FP16 Mixed Precision
                  </span>
                </div>
              </div>

              {/* PRIMARY CTA BUTTON */}
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedVoice}
                  className="w-full py-4 px-8 rounded-full bg-primary-container hover:bg-primary-deep text-white font-bold text-base flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  id="btn-generate"
                >
                  {isGenerating ? (
                    <>
                      <span className="material-symbols-outlined text-[22px] animate-spin">sync</span>
                      <span>Generating Speech with Neural Flow Matching...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[22px]">bolt</span>
                      <span>
                        {language === 'kn'
                          ? 'Generate Speech with Cloned Voice (ಕನ್ನಡ ಧ್ವನಿ)'
                          : 'Generate Speech with Cloned Voice'}
                      </span>
                      <span className="font-mono text-xs font-normal text-white/90 bg-black/20 px-3 py-1 rounded-full">
                        Est: ~3.5s on RTX 5050
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: AUDIO OUTPUT & WAVEFORM SCRUBBER */}
        {generatedAudioUrl && (
          <AudioPlayer
            src={generatedAudioUrl}
            title={selectedVoice ? selectedVoice.name : "Generated Voice Sample"}
            durationSeconds={generationRecord?.duration_seconds || undefined}
            autoPlay={true}
            onRegenerate={handleGenerate}
            onDelete={() => setGeneratedAudioUrl(null)}
          />
        )}
      </div>
    </div>
  );
};
