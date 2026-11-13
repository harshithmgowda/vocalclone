import React from 'react';
import { HealthStatus } from '../types';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  health: HealthStatus | null;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange, health }) => {
  const vramUsed = health?.vram_allocated_mb
    ? (health.vram_allocated_mb / 1024).toFixed(1)
    : '1.2';
  const vramTotal = health?.vram_total_mb
    ? (health.vram_total_mb / 1024).toFixed(1)
    : '8.0';
  const vramPercent = health?.vram_allocated_mb && health?.vram_total_mb
    ? Math.round((health.vram_allocated_mb / health.vram_total_mb) * 100)
    : 15;

  const navLinks = [
    { id: 'studio', label: 'Studio' },
    { id: 'voices', label: 'My Voices' },
    { id: 'history', label: 'Generation History' },
    { id: 'settings', label: 'Telemetry & Settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-hairline-soft">
      <div className="h-16 w-full px-6 md:px-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onPageChange('studio')}>
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white font-bold text-xs shadow-sm">
              VX
            </div>
            <span className="text-xl font-bold tracking-tight text-deep-ink">VOXCLONE AI</span>
            <span className="hidden xl:inline-flex items-center px-3 py-1 rounded-full bg-surface-container-low border border-hairline-soft text-steel text-xs font-mono font-medium">
              F5-TTS v1.1.22 · Blackwell sm_120
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onPageChange(link.id)}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-steel hover:text-deep-ink hover:bg-surface-container-low'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-hairline-soft">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="font-mono text-xs text-steel">
              {health?.gpu_name?.includes('RTX') ? 'RTX 5050' : (health?.gpu_name || 'GPU')} · {vramUsed} / {vramTotal} GB ({vramPercent}%) · CUDA 12.8 · 24kHz
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-hairline-soft text-steel font-mono text-xs">
            <span className="material-symbols-outlined text-[15px] text-primary-container">verified_user</span>
            <span>Local SQLite · 0 Cloud Telemetry</span>
          </div>

          <div className="flex items-center pl-1">
            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-hairline-soft flex items-center justify-center font-bold text-xs text-primary-container">
              AI
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
