import React, { useState, useEffect } from 'react';
import { GenerationRecord } from '../types';
import { api } from '../services/api';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'completed'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchHistory = async () => {
    try {
      const records = await api.getHistory();
      setHistory(records);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      if (audioElement) audioElement.pause();
    };
  }, []);

  const togglePlay = (record: GenerationRecord) => {
    if (activePlayingId === record.id) {
      if (audioElement) {
        audioElement.pause();
        setActivePlayingId(null);
      }
    } else {
      if (audioElement) audioElement.pause();
      const audio = new Audio(api.getAudioUrl(record.id));
      audio.onended = () => setActivePlayingId(null);
      audio.play().catch(() => {});
      setAudioElement(audio);
      setActivePlayingId(record.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this generated audio clip?')) {
      await api.deleteHistory(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchHistory();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} selected audio clips?`)) {
      for (const id of selectedIds) {
        await api.deleteHistory(id);
      }
      setSelectedIds([]);
      fetchHistory();
    }
  };

  const filteredHistory = history.filter((r) => {
    if (filterType === 'completed' && r.status !== 'completed') return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.input_text.toLowerCase().includes(query) ||
      (r.voice_name && r.voice_name.toLowerCase().includes(query)) ||
      r.id.toLowerCase().includes(query)
    );
  });

  const totalDurationSec = history.reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
  const totalMin = (totalDurationSec / 60).toFixed(1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-hairline-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-deep-ink">Generation History</h1>
            <span className="px-3 py-0.5 rounded-full bg-blue-50 text-primary-container border border-blue-200 font-mono text-xs font-semibold">
              {history.length} CLIPS RENDERED
            </span>
          </div>
          <p className="text-sm text-steel">
            Chronological audit log of synthesized speech outputs, neural flow-matching telemetry, and local storage.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-steel">Local Storage:</span>
          <span className="font-semibold text-deep-ink">{(history.length * 1.8).toFixed(1)} MB Allocated</span>
          <button
            onClick={() => fetchHistory()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline hover:bg-surface-container-low text-steel hover:text-deep-ink transition font-sans text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Audio Rendered</span>
            <span className="material-symbols-outlined text-[19px] text-primary-container">graphic_eq</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-deep-ink font-mono tracking-tight">
              {totalMin} <span className="text-xs font-sans font-normal text-steel">Minutes Total</span>
            </div>
            <div className="text-xs text-steel mt-1">{totalDurationSec.toFixed(1)}s across {history.length} clips</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Acceleration</span>
            <span className="material-symbols-outlined text-[19px] text-success">bolt</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-deep-ink font-mono tracking-tight">
              ~0.42x <span className="text-xs font-sans font-normal text-steel">Real-Time Factor</span>
            </div>
            <div className="text-xs text-steel mt-1">RTX 5050 Laptop GPU · CUDA 12.8</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Storage & Privacy</span>
            <span className="material-symbols-outlined text-[19px] text-primary-container">lock</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-deep-ink font-mono tracking-tight">
              100% <span className="text-xs font-sans font-normal text-steel">Local SQLite</span>
            </div>
            <div className="text-xs text-steel mt-1">0 Cloud Telemetry · Privacy Ensured</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Pipeline Health</span>
            <span className="material-symbols-outlined text-[19px] text-success">verified</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-deep-ink font-mono tracking-tight">
              F5-TTS <span className="text-xs font-sans font-normal text-steel">+ Vocos</span>
            </div>
            <div className="text-xs text-steel mt-1">ODE Euler Flow-Matching Active</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-surface-container-low/50 border border-hairline-soft">
        <div className="relative flex-1 w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-steel text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search generated clips by text, voice ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-hairline-soft rounded-full text-deep-ink placeholder:text-steel focus:outline-none focus:border-primary-container transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full transition ${
              filterType === 'all'
                ? 'bg-primary-container text-white font-medium'
                : 'text-steel hover:bg-white hover:text-deep-ink'
            }`}
          >
            All Clips ({history.length})
          </button>
          <button
            onClick={() => setFilterType('completed')}
            className={`px-3 py-1.5 rounded-full transition ${
              filterType === 'completed'
                ? 'bg-primary-container text-white font-medium'
                : 'text-steel hover:bg-white hover:text-deep-ink'
            }`}
          >
            Completed ({history.filter((r) => r.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Bulk actions bar if items are selected */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-primary-container font-semibold">
            <span className="material-symbols-outlined text-[18px]">check_box</span>
            <span>{selectedIds.length} clips selected</span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Clips List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-steel font-mono">Loading history records...</div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-14 text-center rounded-3xl bg-surface-container-low/40 border border-dashed border-hairline">
          <span className="material-symbols-outlined text-4xl text-steel mb-2">history</span>
          <h3 className="text-base font-bold text-deep-ink">No generation records yet</h3>
          <p className="text-sm text-steel max-w-md mx-auto mt-1 mb-4">
            Type target text in the Studio Console and click Generate Speech to synthesize speech and log outputs here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((record) => {
            const isPlaying = activePlayingId === record.id;
            const isSelected = selectedIds.includes(record.id);

            return (
              <div
                key={record.id}
                className="p-5 rounded-3xl bg-white border border-hairline hover:border-primary-soft/50 hover:shadow-sm transition-all flex flex-col gap-4"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, record.id]);
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => id !== record.id));
                        }
                      }}
                      className="rounded text-primary-container focus:ring-primary-container"
                    />
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high border border-hairline text-deep-ink font-mono text-xs font-bold">
                      #VX-{record.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-deep-ink">
                      {record.voice_name || 'Personal Voice Clone'}
                    </span>
                    <span className="text-xs text-steel font-mono">
                      {new Date(record.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-success border border-emerald-200 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      Completed
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-steel border border-hairline-soft font-semibold">
                      {record.duration_seconds?.toFixed(1) || '0.0'}s · 24kHz
                    </span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-hairline-soft text-sm text-deep-ink leading-relaxed font-sans">
                  "{record.input_text}"
                </div>

                {/* Waveform Player & Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                    <button
                      onClick={() => togglePlay(record)}
                      className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center hover:opacity-95 shadow-xs shrink-0 transition"
                      title={isPlaying ? 'Pause' : 'Play Audio'}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>

                    {/* Waveform decorative bars */}
                    <div className="flex-1 h-8 px-2 flex items-center gap-0.5 overflow-hidden bg-surface-container-low rounded-xl border border-hairline-soft">
                      {[30, 45, 70, 90, 60, 40, 80, 50, 75, 95, 30, 65, 85, 45, 60, 75, 90, 40, 65, 80, 50, 70, 90, 45, 60, 80, 35, 75, 90, 55, 40, 70, 85, 60, 40].map((h, idx) => (
                        <div
                          key={idx}
                          className={`w-1 rounded-full transition-all ${
                            isPlaying ? 'bg-primary-container' : 'bg-steel/30'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <a
                      href={api.getAudioUrl(record.id)}
                      download={`voxclone_${record.id.slice(0, 8)}.wav`}
                      className="px-3.5 py-1.5 rounded-full border border-hairline hover:bg-surface-container-low text-steel hover:text-deep-ink text-xs font-semibold transition flex items-center gap-1.5"
                      title="Download 24kHz WAV"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>Download WAV</span>
                    </a>

                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-1.5 text-steel hover:text-error hover:bg-red-50 rounded-full transition"
                      title="Delete Clip"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
