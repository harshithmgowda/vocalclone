import React, { useState } from 'react';
import { VoiceRecord } from '../types';
import { api } from '../services/api';
import { Play, Pause, Trash2, Edit2, Check, Mic, ShieldCheck, ArrowRight } from 'lucide-react';

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
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const togglePlay = (voice: VoiceRecord) => {
    if (playingVoiceId === voice.id) {
      if (audioElement) {
        audioElement.pause();
        setPlayingVoiceId(null);
      }
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(api.getVoiceAudioUrl(voice.id));
      audio.onended = () => setPlayingVoiceId(null);
      audio.play().catch(() => {});
      setAudioElement(audio);
      setPlayingVoiceId(voice.id);
    }
  };

  const handleStartEdit = (voice: VoiceRecord) => {
    setEditingId(voice.id);
    setEditName(voice.name);
  };

  const handleSaveEdit = async (voiceId: string) => {
    if (editName.trim()) {
      await api.updateVoice(voiceId, { name: editName.trim() });
      setEditingId(null);
      onRefresh();
    }
  };

  const handleDelete = async (voiceId: string) => {
    if (confirm("Are you sure you want to permanently delete this voice recording?")) {
      await api.deleteVoice(voiceId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Voice Library</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {voices.length} {voices.length === 1 ? 'verified voice profile' : 'verified voice profiles'} stored locally
          </p>
        </div>
      </div>

      {voices.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-100 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-surface-200 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <Mic className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No reference voices yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Navigate to the Studio tab to record your own microphone speech or upload an authorized audio clip.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {voices.map((voice) => {
            const isPlaying = playingVoiceId === voice.id;
            const isEditing = editingId === voice.id;

            return (
              <div
                key={voice.id}
                className="p-5 rounded-2xl bg-surface-100 border border-slate-800 hover:border-slate-700 shadow-sm space-y-4 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    {isEditing ? (
                      <div className="flex items-center space-x-1.5 flex-1 mr-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs bg-surface-300 border border-indigo-500 rounded-lg px-2.5 py-1 text-slate-100 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(voice.id)}
                          className="p-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-white truncate max-w-[170px]">
                          {voice.name}
                        </h4>
                        <button
                          onClick={() => handleStartEdit(voice)}
                          className="text-slate-400 hover:text-slate-200 transition"
                          title="Rename voice"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Consent
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mt-3 italic bg-surface-300 p-2.5 rounded-lg border border-slate-800">
                    "{voice.transcription || 'No transcription recorded'}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums mt-3">
                    <span>Duration: {voice.duration_seconds.toFixed(1)}s</span>
                    <span className="text-slate-300">{voice.sample_rate / 1000}kHz 16-bit</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => togglePlay(voice)}
                      className="p-2 rounded-lg bg-surface-300 hover:bg-surface-200 text-slate-200 border border-slate-700/80 transition shadow-sm"
                      title={isPlaying ? "Pause" : "Play preview"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(voice.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete voice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onVoiceSelected(voice)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                  >
                    <span>Use in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
