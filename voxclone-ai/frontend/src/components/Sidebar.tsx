import React from 'react';
import { Mic, Waves, History, Settings, Info, Cpu, Terminal } from 'lucide-react';
import { HealthStatus } from '../types';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  health: HealthStatus | null;
  voiceCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, health, voiceCount = 0 }) => {
  const navItems = [
    { id: 'studio', label: 'Studio', icon: Mic, badge: null },
    { id: 'voices', label: 'My Voices', icon: Waves, badge: voiceCount > 0 ? String(voiceCount) : null },
    { id: 'history', label: 'Generation History', icon: History, badge: null },
    { id: 'settings', label: 'System Settings', icon: Settings, badge: null },
    { id: 'about', label: 'About & Privacy', icon: Info, badge: null },
  ];

  const vramPercent = health?.vram_allocated_mb && health?.vram_total_mb
    ? Math.round((health.vram_allocated_mb / health.vram_total_mb) * 100)
    : 10;

  return (
    <aside className="w-64 h-full bg-surface-200 border-r border-slate-800 flex flex-col justify-between p-3.5 flex-shrink-0 select-none z-30">
      <div className="space-y-4">
        {/* Workstation Engine Card */}
        <div className="p-3 rounded-xl bg-surface-300 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-100 border border-slate-700/80 flex items-center justify-center text-indigo-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-100 leading-tight">F5-TTS Engine</div>
            <div className="text-[11px] text-emerald-400 font-medium">Flow-Matching · 24kHz</div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-surface-100 text-white font-medium border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Hardware Telemetry Card */}
      <div className="space-y-2.5">
        <div className="p-3 rounded-xl bg-surface-300 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-200 text-xs font-medium">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>RTX 5050 · CUDA 12.8</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          {/* VRAM Meter */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono tabular-nums text-[10px] text-slate-400">
              <span>VRAM Allocation</span>
              <span className="text-slate-200">
                {health?.vram_allocated_mb ? `${(health.vram_allocated_mb / 1024).toFixed(1)} GB` : '0.7 GB'} / 8.0 GB
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(vramPercent, 12)}%` }}
              />
            </div>
          </div>

          {/* Engine Status */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400">Engine State</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              F5-TTS Online
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-500 px-1 text-[11px]">
          <span>VOXCLONE AI Studio</span>
          <span className="font-mono text-[10px]">v1.0.4</span>
        </div>
      </div>
    </aside>
  );
};
