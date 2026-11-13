import React, { useState, useEffect } from 'react';
import { GenerationRecord } from '../types';
import { api } from '../services/api';
import { Play, Pause, Download, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const fetchHistory = async () => {
    try {
      const records = await api.getHistory();
      setHistory(records);
    } catch (e) {
      console.error("Failed to load history", e);
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
    if (confirm("Delete this audio generation record?")) {
      await api.deleteHistory(id);
      fetchHistory();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Generation History</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse, listen, download, or delete past generated audio clips synthesized by VoxClone AI
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading history records...</div>
      ) : history.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-100 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-surface-200 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No speech generations yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Generate speech in the Studio to automatically save and track your audio output history here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => {
            const isPlaying = activePlayingId === record.id;
            return (
              <div
                key={record.id}
                className="p-5 rounded-2xl bg-surface-100 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {record.voice_name || 'Personal Voice'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                      {new Date(record.created_at).toLocaleString()}
                    </span>
                    {record.status === 'completed' ? (
                      <span className="flex items-center text-[10px] text-emerald-400 gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] text-rose-400 gap-1 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> {record.status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-normal">
                    "{record.input_text}"
                  </p>

                  <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-mono tabular-nums pt-0.5">
                    <span>Duration: <strong className="text-slate-200">{record.duration_seconds?.toFixed(1) || '0'}s</strong></span>
                    <span>Device: <strong className="text-slate-200">{record.device_used?.toUpperCase() || 'GPU'}</strong></span>
                    <span>NFE: <strong className="text-slate-200">{record.nfe_steps || 32}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                  {record.status === 'completed' && (
                    <>
                      <button
                        onClick={() => togglePlay(record)}
                        className="p-2.5 rounded-xl bg-surface-300 hover:bg-surface-200 text-slate-200 border border-slate-700/80 transition shadow-sm"
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      <a
                        href={api.getAudioUrl(record.id)}
                        download={`voxclone_${record.id.slice(0, 8)}.wav`}
                        className="p-2.5 rounded-xl bg-surface-300 hover:bg-surface-200 text-slate-200 border border-slate-700/80 transition"
                        title="Download WAV"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete generation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
