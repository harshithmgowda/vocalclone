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
      console.warn('Could not load voices', e);
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
    setVoices((prev) => [voice, ...prev.filter((v) => v.id !== voice.id)]);
    setCurrentPage('studio');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-ink antialiased selection:bg-primary-container selection:text-white">
      {/* Top Header */}
      <Header
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        health={health}
      />

      {/* Left Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        health={health}
        voiceCount={voices.length}
      />

      {/* Main Container */}
      <div className="md:pl-64 pt-16 min-h-screen bg-white">
        {/* Backend Error Banner */}
        {backendError && (
          <div className="bg-red-50 border-b border-red-200 px-6 md:px-10 py-3 text-xs text-error flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="font-medium">{backendError}</span>
            </div>
            <button
              onClick={() => {
                fetchHealth();
                fetchVoices();
              }}
              className="px-3 py-1 rounded-full bg-white border border-red-300 text-error font-medium hover:bg-red-100 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        <main className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
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
        </main>
      </div>
    </div>
  );
}

export default App;
