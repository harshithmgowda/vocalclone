import React, { useState } from 'react';
import { VoiceRecord } from '../types';
import { api } from '../services/api';

interface MyVoicesPageProps {
  voices: VoiceRecord[];
  onVoiceSelected: (voice: VoiceRecord) => void;
  onRefresh: () => void;
}

export const MyVoicesPage: React.FC<MyVoicesPageProps> = ({
  voices,
  onVoiceSelected,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [quickTestText, setQuickTestText] = useState('Voice clone fidelity verified on RTX 5050 Blackwell.');
  const [testResultAudio, setTestResultAudio] = useState<string | null>(null);

  const filteredVoices = voices.filter((v) => {
    const transcript = v.transcription || '';
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transcript.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete voice profile "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.deleteVoice(id);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to delete voice: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickTest = async (voice: VoiceRecord) => {
    setTestingVoiceId(voice.id);
    setTestResultAudio(null);
    try {
      const resp = await api.generateSpeech(voice.id, {
        target_text: quickTestText,
        ref_text: voice.transcription || 'Sample reference audio',
        speed: 1.0,
        nfe_steps: 32,
        cfg_strength: 2.0,
      });
      setTestResultAudio(resp.audio_url);
    } catch (err: any) {
      alert(`Quick test failed: ${err.message}`);
    } finally {
      setTestingVoiceId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-hairline-soft">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-deep-ink">Enrolled Voice Library</h1>
            <span className="px-3 py-0.5 rounded-full bg-blue-50 text-primary-container border border-blue-200 font-mono text-xs font-semibold">
              {voices.length} PROFILES ENROLLED
            </span>
          </div>
          <p className="text-sm text-steel mt-1">
            Reference timbre profiles enrolled for local flow-matching speech synthesis and instant zero-shot cloning.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onRefresh()}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-hairline hover:bg-surface-container-low text-steel hover:text-deep-ink text-sm font-semibold transition"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Enrolled Profiles</span>
            <span className="material-symbols-outlined text-[19px] text-primary-container">record_voice_over</span>
          </div>
          <div className="text-2xl font-bold text-deep-ink tracking-tight font-mono">
            {voices.length} <span className="text-xs font-sans font-normal text-steel">Active Timbre Seeds</span>
          </div>
          <p className="text-xs text-steel mt-1">SQLite local database · zero cloud telemetry</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Storage Footprint</span>
            <span className="material-symbols-outlined text-[19px] text-success">folder_open</span>
          </div>
          <div className="text-2xl font-bold text-deep-ink tracking-tight font-mono">
            {(voices.length * 2.4).toFixed(1)} <span className="text-xs font-sans font-normal text-steel">MB Approx</span>
          </div>
          <p className="text-xs text-steel mt-1">16-bit PCM WAV (24kHz Mono Resampled)</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Synthesizer Core</span>
            <span className="material-symbols-outlined text-[19px] text-warning">neurology</span>
          </div>
          <div className="text-2xl font-bold text-deep-ink tracking-tight font-mono">
            F5-TTS DiT <span className="text-xs font-sans font-normal text-steel">+ Vocos Vocoder</span>
          </div>
          <p className="text-xs text-steel mt-1">ODE Euler Flow-Matching · RTX 5050 CUDA 12.8</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-surface-container-low/50 border border-hairline-soft">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-steel text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search voice profiles, transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-hairline-soft rounded-full text-deep-ink placeholder:text-steel focus:outline-none focus:border-primary-container transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-full transition ${
              selectedFilter === 'all'
                ? 'bg-primary-container text-white font-medium'
                : 'text-steel hover:bg-white hover:text-deep-ink'
            }`}
          >
            All Voices ({voices.length})
          </button>
        </div>
      </div>

      {/* Voice Grid */}
      {filteredVoices.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-container-low/40 border border-dashed border-hairline">
          <span className="material-symbols-outlined text-4xl text-steel mb-2">mic_off</span>
          <h3 className="text-base font-bold text-deep-ink">No voice profiles enrolled yet</h3>
          <p className="text-sm text-steel max-w-md mx-auto mt-1 mb-4">
            Record or upload an audio clip (3–10 seconds) in the Studio Console to enroll your first voice clone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredVoices.map((voice, idx) => {
            const isPlaying = playingVoiceId === voice.id;
            const isTesting = testingVoiceId === voice.id;
            const audioUrl = api.getVoiceAudioUrl(voice.id);

            return (
              <div
                key={voice.id}
                className="group relative p-6 rounded-3xl bg-white border border-hairline hover:border-primary-soft/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-surface-container-high text-primary-container font-mono font-bold text-sm flex items-center justify-center border border-hairline-soft shadow-xs">
                        {voice.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-deep-ink text-base tracking-tight">{voice.name}</h3>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary-container text-[10px] font-mono font-bold border border-blue-200">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-steel font-mono mt-0.5">
                          Enrolled {new Date(voice.created_at).toLocaleDateString()} · 24kHz Mono
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(voice.id, voice.name)}
                      disabled={deletingId === voice.id}
                      className="p-2 text-steel hover:text-error hover:bg-red-50 rounded-full transition"
                      title="Delete Profile"
                    >
                      <span className="material-symbols-outlined text-[19px]">delete</span>
                    </button>
                  </div>

                  {/* Audio Player Bar */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-hairline-soft flex items-center gap-3 mb-4">
                    <button
                      onClick={() => {
                        const audioEl = document.getElementById(`audio-elem-${voice.id}`) as HTMLAudioElement;
                        if (!audioEl) return;
                        if (isPlaying) {
                          audioEl.pause();
                          setPlayingVoiceId(null);
                        } else {
                          audioEl.play();
                          setPlayingVoiceId(voice.id);
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center shadow-xs shrink-0 hover:opacity-95 transition"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>

                    <audio
                      id={`audio-elem-${voice.id}`}
                      src={audioUrl}
                      onEnded={() => setPlayingVoiceId(null)}
                      onPause={() => setPlayingVoiceId(null)}
                      className="hidden"
                    />

                    <div className="flex-1">
                      <div className="h-6 flex items-center gap-0.5 px-1 overflow-hidden">
                        {[40, 65, 80, 50, 95, 30, 85, 60, 45, 90, 75, 40, 60, 85, 70, 55, 90, 40, 65, 80, 50, 70, 90, 45, 60, 80, 35, 75, 90, 55, 40, 70, 85].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              isPlaying ? 'bg-primary-container' : 'bg-steel/30'
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Transcript quote */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-hairline-soft/80 text-xs text-charcoal italic mb-4 line-clamp-3">
                    "{voice.transcription || 'No transcription recorded'}"
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-hairline-soft flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-steel">
                    <span className="material-symbols-outlined text-[14px] text-success">check_circle</span>
                    <span>Ready for Synthesis</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickTest(voice)}
                      disabled={isTesting}
                      className="px-3.5 py-1.5 rounded-full border border-hairline text-steel hover:text-deep-ink hover:bg-surface-container-low text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isTesting ? 'progress_activity' : 'bolt'}
                      </span>
                      <span>{isTesting ? 'Synthesizing...' : 'Quick Test'}</span>
                    </button>

                    <button
                      onClick={() => onVoiceSelected(voice)}
                      className="px-4 py-1.5 rounded-full bg-primary-container text-white text-xs font-semibold hover:opacity-95 shadow-xs transition flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">mic</span>
                      <span>Use in Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Verification Drawer / Card */}
      <div className="p-6 rounded-3xl bg-surface-container-low/80 border border-hairline-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">science</span>
            <h3 className="font-bold text-deep-ink text-sm uppercase font-mono tracking-wider">
              Quick Timbre & Prosody Verification
            </h3>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={quickTestText}
            onChange={(e) => setQuickTestText(e.target.value)}
            placeholder="Type verification sentence to test timbre..."
            className="flex-1 w-full px-4 py-2.5 rounded-full bg-white border border-hairline text-sm text-deep-ink placeholder:text-steel focus:outline-none focus:border-primary-container"
          />
        </div>

        {testResultAudio && (
          <div className="mt-4 p-3 rounded-2xl bg-white border border-hairline flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-success">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Test Audio Ready</span>
            </div>
            <audio controls src={testResultAudio} className="h-8 max-w-sm" autoPlay />
          </div>
        )}
      </div>
    </div>
  );
};
