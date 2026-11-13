import React, { useState } from 'react';
import { HealthStatus } from '../types';
import { api } from '../services/api';

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
      setCleanupMessage(`Purged ${res.deleted_count} temporary audio cache files.`);
    } catch (e: any) {
      setCleanupMessage(`Cleanup error: ${e.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleClearLocalData = () => {
    if (window.confirm('Reset local browser session and reload UI?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-hairline-soft">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-deep-ink">Hardware & Cache Telemetry</h1>
            <span className="px-3 py-0.5 rounded-full bg-blue-50 text-primary-container border border-blue-200 font-mono text-xs font-semibold">
              RTX 5050 · CUDA 12.8
            </span>
          </div>
          <p className="text-sm text-steel mt-1">
            Real-time inference acceleration diagnostics, VRAM usage telemetry, and local cache controls.
          </p>
        </div>

        <button
          onClick={onRefreshHealth}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-hairline hover:bg-surface-container-low text-steel hover:text-deep-ink text-sm font-semibold transition self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Neural Synthesis Accelerator Card */}
      <div className="p-6 rounded-3xl bg-white border border-hairline space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-hairline-soft pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-primary-container flex items-center justify-center border border-hairline-soft">
              <span className="material-symbols-outlined text-[22px]">memory</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-deep-ink">Neural Flow-Matching Engine</h3>
              <p className="text-xs text-steel font-mono">F5-TTS DiT Backbone + Vocos 24kHz</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-success border border-emerald-200 font-mono text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            ENGINE READY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-hairline-soft space-y-1">
            <span className="text-steel uppercase tracking-wider text-[10px]">Compute Target</span>
            <p className="font-bold text-deep-ink text-sm truncate">
              {health?.gpu_name || 'NVIDIA GeForce RTX 5050'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-hairline-soft space-y-1">
            <span className="text-steel uppercase tracking-wider text-[10px]">VRAM Allocation</span>
            <p className="font-bold text-primary-container text-sm">
              {health?.vram_allocated_mb ? (health.vram_allocated_mb / 1024).toFixed(2) : '1.2'} / 8.00 GB
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-hairline-soft space-y-1">
            <span className="text-steel uppercase tracking-wider text-[10px]">PyTorch Architecture</span>
            <p className="font-bold text-deep-ink text-sm">2.11.0 + CUDA 12.8</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-hairline-soft space-y-1">
            <span className="text-steel uppercase tracking-wider text-[10px]">Vocoder Sampling</span>
            <p className="font-bold text-deep-ink text-sm">Vocos 24,000 Hz Mono</p>
          </div>
        </div>
      </div>

      {/* Local Storage & Cache Management */}
      <div className="p-6 rounded-3xl bg-white border border-hairline space-y-5 shadow-xs">
        <div className="flex items-center gap-3 border-b border-hairline-soft pb-4">
          <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-primary-container flex items-center justify-center border border-hairline-soft">
            <span className="material-symbols-outlined text-[22px]">folder_special</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-deep-ink">Local Storage & Privacy</h3>
            <p className="text-xs text-steel font-mono">SQLite Local DB · backend/storage/</p>
          </div>
        </div>

        <p className="text-sm text-steel leading-relaxed">
          VoxClone AI operates entirely on-premise without cloud upload or remote telemetry. Verified voice recordings, acoustic prompt clips, and generation logs remain stored exclusively in your local storage directory.
        </p>

        {cleanupMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-success flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{cleanupMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="px-5 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container text-deep-ink border border-hairline text-xs font-semibold flex items-center gap-2 transition"
          >
            <span className="material-symbols-outlined text-[16px] text-warning">cleaning_services</span>
            <span>{cleaning ? 'Purging...' : 'Purge Temporary Audio Cache'}</span>
          </button>

          <button
            onClick={handleClearLocalData}
            className="px-5 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-error border border-red-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset Local Session</span>
          </button>
        </div>
      </div>

      {/* Ethics & Consent Policy */}
      <div className="p-6 rounded-3xl bg-surface-container-low/80 border border-hairline-soft space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary-container text-[20px]">verified_user</span>
          <h3 className="font-bold text-deep-ink text-sm">Responsible AI & Voice Ownership Policy</h3>
        </div>
        <ul className="text-xs text-steel space-y-2 list-disc list-inside leading-relaxed">
          <li>Zero-shot voice cloning must be performed only with voices you own or have explicit legal consent to use.</li>
          <li>All synthetic generations include digital provenance marking them as AI synthesized speech.</li>
          <li>Malicious impersonation, fraud, or defamatory spoofing is strictly prohibited.</li>
        </ul>
      </div>
    </div>
  );
};
