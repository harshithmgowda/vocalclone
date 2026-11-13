import React from 'react';
import { HealthStatus } from '../types';
import { ShieldCheck, Zap, Radio, Sliders } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  health: HealthStatus | null;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, health }) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    studio: {
      title: 'Voice Cloning Studio',
      subtitle: 'Condition neural flow matching on verified reference audio',
    },
    voices: {
      title: 'Voice Library',
      subtitle: 'Manage and preview verified reference voices and acoustic profiles',
    },
    history: {
      title: 'Generation History',
      subtitle: 'Browse, listen, download, or delete past generated audio clips',
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Hardware configuration, model parameters, and local data policies',
    },
    about: {
      title: 'About VOXCLONE AI',
      subtitle: 'Architecture, safety guidelines, and neural voice synthesis specifications',
    },
  };

  const current = titles[currentPage] || { title: 'VOXCLONE AI', subtitle: 'Neural Voice Synthesis' };

  return (
    <header className="h-14 bg-surface-200 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Page Identity */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">VOXCLONE AI</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                v1.0 STUDIO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">Your Voice. Your AI. Your Words.</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800">
          <span className="text-xs font-semibold text-slate-200">{current.title}</span>
          <span className="text-slate-400 text-xs">· {current.subtitle}</span>
        </div>
      </div>

      {/* Status Badges & Hardware Telemetry */}
      <div className="flex items-center gap-3">
        {/* Consent Verification Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Authorized Consent Enforced</span>
        </div>

        {/* CUDA Hardware Device Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>{health?.cuda_available ? 'CUDA 12.8 · RTX 5050 (8GB)' : 'Device: CPU'}</span>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-medium">{health?.status === 'ok' ? 'Online' : 'Connecting'}</span>
          <span className="text-slate-500 font-mono text-[10px] tabular-nums">(RTF ~0.35x)</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
          <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition" title="Preferences">
            <Sliders className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-full bg-surface-100 border border-slate-700 flex items-center justify-center font-mono text-indigo-300 font-semibold text-[10px] ml-1">
            AI
          </div>
        </div>
      </div>
    </header>
  );
};
