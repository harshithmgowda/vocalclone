import React from 'react';
import { HealthStatus } from '../types';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  health: HealthStatus | null;
  voiceCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, health, voiceCount = 0 }) => {
  const navItems = [
    { id: 'studio', label: 'Studio Console', icon: 'mic', count: null },
    { id: 'voices', label: 'My Voices', icon: 'graphic_eq', count: voiceCount > 0 ? voiceCount : null },
    { id: 'history', label: 'Generation Log', icon: 'history', count: null },
    { id: 'settings', label: 'Hardware & Cache', icon: 'memory', count: null },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-hairline-soft z-40 hidden md:flex flex-col py-6 select-none">
      <div className="px-6 mb-4 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-steel font-mono">Workspace</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-success text-[10px] font-mono font-semibold border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
          ONLINE
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
                isActive
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-steel hover:bg-surface-container-low hover:text-deep-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.count !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white text-primary-container' : 'bg-surface-container text-steel'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Bottom Metric */}
      <div className="px-4 mt-auto pt-4 space-y-3">
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-hairline-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-deep-ink font-mono uppercase">NFE Guidance</span>
            <span className="text-xs font-mono font-bold text-primary-container">32 steps</span>
          </div>
          <div className="w-full bg-hairline-soft h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary-container h-full w-2/3 rounded-full"></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-steel px-2 font-mono text-[10px]">
          <span>VOXCLONE v1.2</span>
          <span>RTX 5050 OK</span>
        </div>
      </div>
    </aside>
  );
};
