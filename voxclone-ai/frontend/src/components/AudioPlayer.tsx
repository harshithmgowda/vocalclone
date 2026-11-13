import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  durationSeconds?: number;
  onDelete?: () => void;
  onRegenerate?: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = "Personal Voice Sample (24kHz)",
  durationSeconds,
  onDelete,
  onRegenerate,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [volume, setVolume] = useState(0.85);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration || durationSeconds || 0;
      setDuration(dur);
      if (autoPlay) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100;
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const handleReplay5 = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
  };

  const handleForward5 = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
  };

  const setRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + src);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSecs = (sec: number) => {
    if (isNaN(sec)) return "00:00.00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-surface-container-low rounded-3xl border border-hairline-soft p-6 shadow-sm space-y-5">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Output Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-hairline-soft">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-deep-ink">Generated Neural Speech</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-success font-mono text-xs font-bold">
                SYNTHESIS SUCCESS
              </span>
            </div>
            <div className="text-xs text-steel mt-0.5">
              Voice: <strong className="text-deep-ink font-semibold">"{title}"</strong> · Target Duration: <span className="font-mono text-deep-ink font-bold">{formatSecs(duration)}</span>
            </div>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-4 py-2 rounded-full bg-white border border-hairline text-steel hover:text-deep-ink hover:bg-surface-container-low font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Regenerate
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-full bg-white border border-hairline text-steel hover:text-deep-ink hover:bg-surface-container-low font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'link'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <a
            href={src}
            download="voxclone_generated_audio.wav"
            className="px-5 py-2 rounded-full bg-primary-container text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-primary-deep transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Download WAV (24kHz 16-bit)
          </a>

          {onDelete && (
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-full bg-white border border-hairline text-steel hover:text-error hover:bg-surface-container-low flex items-center justify-center transition-all shadow-xs"
              title="Dismiss Player"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Audio Scrubber Timeline */}
      <div className="bg-white rounded-2xl p-5 border border-hairline-soft space-y-3 shadow-xs">
        <div className="flex justify-between items-center font-mono text-xs text-steel">
          <span className="flex items-center gap-1.5 font-bold uppercase text-deep-ink">
            <span className="material-symbols-outlined text-[15px] text-primary-container">audiotrack</span>
            F0-Pitch &amp; Mel-Spectral Waveform Render
          </span>
          <div className="flex items-center gap-3">
            <span className="text-primary-container font-bold">CURSOR: {formatSecs(currentTime)}</span>
            <span>TOTAL: {formatSecs(duration)}</span>
          </div>
        </div>

        {/* Waveform Stage with Needle */}
        <div
          onClick={handleSeek}
          className="relative h-24 bg-surface-container-low rounded-xl flex items-center px-4 cursor-pointer overflow-hidden border border-hairline-soft select-none"
        >
          {/* Background Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-40">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="border-r border-hairline"></div>
            ))}
            <div></div>
          </div>

          {/* Synthetic Waveform Bars */}
          <div className="w-full h-20 flex items-center justify-between gap-[3px] z-0">
            {Array.from({ length: 64 }).map((_, i) => {
              const height = 16 + Math.sin(i * 0.45) * 36 + (i % 3 === 0 ? 12 : 0);
              const isPlayed = (i / 64) * 100 <= progressPercent;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-colors ${
                    isPlayed
                      ? i % 4 === 0
                        ? 'bg-deep-ink'
                        : i % 2 === 0
                        ? 'bg-primary-container'
                        : 'bg-primary-soft'
                      : 'bg-hairline'
                  }`}
                  style={{ height: `${Math.min(72, height)}px` }}
                ></div>
              );
            })}
          </div>

          {/* Scrubber Line & Pill */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-primary-container z-10 pointer-events-none transition-all"
            style={{ left: `${progressPercent}%` }}
          >
            <div className="absolute -top-1 -left-[27px] bg-deep-ink text-white font-mono text-[10px] px-2 py-0.5 rounded-full shadow-xs font-bold whitespace-nowrap">
              {formatSecs(currentTime)}
            </div>
          </div>
        </div>

        {/* Transport Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Transport Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplay5}
              className="w-9 h-9 rounded-full bg-surface-container-low border border-hairline text-deep-ink hover:bg-surface-container-high flex items-center justify-center transition-all shadow-xs"
              title="Replay 5s"
            >
              <span className="material-symbols-outlined text-[18px]">replay_5</span>
            </button>
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-primary-container text-white hover:bg-primary-deep flex items-center justify-center transition-all shadow-sm"
              title="Play / Pause"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              onClick={handleForward5}
              className="w-9 h-9 rounded-full bg-surface-container-low border border-hairline text-deep-ink hover:bg-surface-container-high flex items-center justify-center transition-all shadow-xs"
              title="Skip 5s"
            >
              <span className="material-symbols-outlined text-[18px]">forward_5</span>
            </button>
            <div className="font-mono text-xs text-deep-ink pl-2 font-medium">
              <span className="text-primary-container font-bold">{formatSecs(currentTime)}</span>
              <span className="text-steel"> / {formatSecs(duration)}</span>
            </div>
          </div>

          {/* Speed & Volume */}
          <div className="flex items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center bg-surface-container-low rounded-full p-1 border border-hairline-soft font-mono text-xs">
              {[0.9, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setRate(rate)}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    playbackRate === rate
                      ? 'bg-white text-primary-container font-bold shadow-xs'
                      : 'text-steel hover:text-deep-ink font-semibold'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-steel">volume_up</span>
              <input
                className="w-20 accent-primary-container h-1.5 bg-hairline-soft rounded-full cursor-pointer"
                max="100"
                min="0"
                type="range"
                value={Math.round(volume * 100)}
                onChange={handleVolumeChange}
              />
              <span className="font-mono text-xs text-steel">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inference Telemetry Footer Metrics */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-steel">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-success">memory</span>
            <span>Device: <strong className="text-deep-ink font-semibold">NVIDIA RTX 5050 (sm_120)</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-primary-container">speed</span>
            <span>RTF: <strong className="text-success font-semibold">~0.35x (Realtime)</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-steel">equalizer</span>
            <span>Vocoder: <strong className="text-deep-ink font-semibold">Vocos-Mel (24kHz)</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-steel">storage</span>
            <span>VRAM: <strong className="text-deep-ink font-semibold">Loaded in VRAM</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs text-steel">
          <span className="material-symbols-outlined text-[14px]">description</span>
          <span>storage/generated/vox_output.wav</span>
        </div>
      </div>
    </div>
  );
};
