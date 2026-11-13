import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StudioPage } from './components/StudioPage';
import { MyVoicesPage } from './components/MyVoicesPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { AboutPage } from './components/AboutPage';
import { HealthStatus, VoiceRecord } from './types';
import { api } from './services/api';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState('studio');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [voices, setVoices] = useState<VoiceRecord[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setBackendError(null);
    } catch (err: any) {
      setBackendError(err.message || 'Cannot connect to backend server');
      setHealth(null);
    }
  };

  const fetchVoices = async () => {
    try {
      const list = await api.getVoices();
      setVoices(list);
    } catch (e) {
      console.warn("Could not load voices", e);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchVoices();

    const interval = setInterval(() => {
      fetchHealth();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleVoiceSelectedFromLibrary = (voice: VoiceRecord) => {
    // Put selected voice at the front so studio picks it up
    setVoices((prev) => [voice, ...prev.filter((v) => v.id !== voice.id)]);
    setCurrentPage('studio');
  };

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        health={health}
        voiceCount={voices.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header currentPage={currentPage} health={health} />

        {/* Backend Disconnected Notice */}
        {backendError && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-8 py-2.5 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{backendError}</span>
            </div>
            <button
              onClick={() => {
                fetchHealth();
                fetchVoices();
              }}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-[11px] font-medium transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto p-8 bg-surface-300/30">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'studio' && (
              <StudioPage voices={voices} onVoiceCreated={fetchVoices} />
            )}
            {currentPage === 'voices' && (
              <MyVoicesPage
                voices={voices}
                onVoiceSelected={handleVoiceSelectedFromLibrary}
                onRefresh={fetchVoices}
              />
            )}
            {currentPage === 'history' && <HistoryPage />}
            {currentPage === 'settings' && (
              <SettingsPage health={health} onRefreshHealth={fetchHealth} />
            )}
            {currentPage === 'about' && <AboutPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
