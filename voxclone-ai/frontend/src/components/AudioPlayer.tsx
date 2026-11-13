import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Trash2, FastForward, Music } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  onDelete?: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = "Generated Audio Output",
  onDelete,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

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
      setDuration(audioRef.current.duration || 0);
      if (autoPlay) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.85;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleRewind5 = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
  };

  const handleForward5 = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.2, 1.5, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return "00:00";
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    const ms = Math.floor((timeInSec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto select-none">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Left Output Ident */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <div className="w-9 h-9 rounded-lg bg-surface-300 border border-slate-700/60 flex items-center justify-center text-indigo-400">
          <Music className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white truncate max-w-[140px]">{title}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              Synthesized
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">vox_clone_output.wav · 24kHz</div>
        </div>
      </div>

      {/* Center Scrubber & Transport Controls */}
      <div className="flex-1 max-w-2xl w-full space-y-1.5">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleRewind5}
            className="p-1 rounded text-slate-400 hover:text-white transition"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={handleForward5}
            className="p-1 rounded text-slate-400 hover:text-white transition"
            title="Forward 5s"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 pl-3 text-slate-400">
            <button onClick={toggleMute} className="hover:text-slate-200">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Speed Selector */}
          <button
            onClick={cyclePlaybackRate}
            className="px-1.5 py-0.5 rounded bg-surface-300 text-slate-300 hover:text-white font-mono text-[10px] border border-slate-700"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Waveform Scrubber & Timestamps */}
        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums text-[10px] text-slate-300 font-medium w-14 text-right">
            {formatTime(currentTime)}
          </span>

          <div className="flex-1 h-5 bg-surface-300 rounded relative overflow-hidden flex items-center px-1 border border-slate-800">
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 border-r-2 border-indigo-400 pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-20"
            />
            {/* Soundwave bars inside the scrubber */}
            <div className="w-full flex items-center justify-between gap-[2px] z-10 pointer-events-none px-1">
              {Array.from({ length: 48 }).map((_, i) => {
                const height = 4 + Math.sin(i * 0.4) * 8 + (i % 3 === 0 ? 4 : 0);
                const isPast = (i / 48) * 100 <= progressPercent;
                return (
                  <span
                    key={i}
                    className={`w-[2px] rounded-full transition-colors ${
                      isPast ? 'bg-indigo-400' : 'bg-slate-700'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>

          <span className="font-mono tabular-nums text-[10px] text-slate-400 w-14">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <a
          href={src}
          download="voxclone_generated_speech.wav"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition"
          title="Download WAV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download WAV</span>
        </a>

        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Dismiss"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
