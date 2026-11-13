import React, { useState } from 'react';
import { HealthStatus } from '../types';
import { api } from '../services/api';
import { Cpu, HardDrive, Trash2, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

interface SettingsPageProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ health, onRefreshHealth }) => {
  const [cleaning, setCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanupMessage(null);
    try {
      const res = await api.cleanupTemporary();
      setCleanupMessage(`Cleaned up ${res.deleted_count} temporary files successfully.`);
    } catch (e: any) {
      setCleanupMessage(`Cleanup error: ${e.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleClearLocalData = () => {
    if (confirm("Clear local cache and refresh page?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-base font-semibold text-white">System Settings</h3>
        <p className="text-xs text-slate-400">
          Hardware acceleration, neural engine telemetry, and local storage configuration
        </p>
      </div>

      {/* Model & Accelerator Card */}
      <div className="p-6 rounded-2xl bg-surface-100 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-semibold text-slate-200">Neural Synthesis Engine</h4>
          </div>
          <button
            onClick={onRefreshHealth}
            className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-200 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Architecture</span>
            <p className="font-semibold text-slate-200">F5-TTS (Flow-Matching Transformer)</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-200 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Compute Device</span>
            <p className="font-semibold text-slate-200 flex items-center gap-1.5">
              {health?.gpu_name || health?.device?.toUpperCase() || 'GPU'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-200 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Model Engine State</span>
            <p className="font-semibold text-emerald-400 capitalize">
              {health?.model_status === 'ready' ? 'Ready & Loaded in VRAM' : health?.model_status}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-200 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Vocoder</span>
            <p className="font-semibold text-slate-200">Vocos 24kHz (Neural Mel-Vocoder)</p>
          </div>
        </div>
      </div>

      {/* Storage Management */}
      <div className="p-6 rounded-2xl bg-surface-100 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <HardDrive className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-semibold text-slate-200">Storage & Database</h4>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          VoxClone AI stores all audio files, verified reference recordings, and generation history locally on your device in <code className="text-slate-200 bg-surface-300 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono text-[11px]">backend/storage/</code>. No audio is ever transmitted to cloud servers.
        </p>

        {cleanupMessage && (
          <div className="p-3 rounded-xl bg-surface-200 border border-slate-700 text-xs text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{cleanupMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="px-4 py-2 rounded-xl bg-surface-300 hover:bg-surface-200 border border-slate-700 text-xs font-medium text-slate-200 flex items-center space-x-2 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{cleaning ? 'Cleaning...' : 'Purge Temporary Files'}</span>
          </button>

          <button
            onClick={handleClearLocalData}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-300 flex items-center space-x-2 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Local Session</span>
          </button>
        </div>
      </div>

      {/* Ethics & Privacy */}
      <div className="p-6 rounded-2xl bg-surface-100 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-semibold text-slate-200">Privacy & Ethics Policy</h4>
        </div>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
          <li>All reference voice audio is processed locally on your machine.</li>
          <li>Users must hold legal authorization to clone reference recordings.</li>
          <li>Unauthorized impersonation and deception are strictly prohibited.</li>
          <li>Audio clips generated by VoxClone AI are tagged as synthetic speech.</li>
        </ul>
      </div>
    </div>
  );
};
