import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, FastForward, RotateCcw } from 'lucide-react';
import { globalAudioPlayer, AudioPlayerState } from '../services/audio/audioPlayer';

export const AudioPlayerBar: React.FC = () => {
  const [state, setState] = useState<AudioPlayerState>(globalAudioPlayer.getState());

  useEffect(() => {
    const unsubscribe = globalAudioPlayer.subscribe(setState);
    return unsubscribe;
  }, []);

  if (!state.title && !state.isPlaying && state.duration === 0) {
    return null; // hide if nothing has been played or loaded yet
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    globalAudioPlayer.seek(val);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    globalAudioPlayer.setVolume(val);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 text-stone-100 py-2.5 px-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Track Title */}
        <div className="flex items-center gap-3 w-full sm:w-1/3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-white block truncate">
              {state.title || 'نمونه صوتی ردیف'}
            </span>
            <span className="text-[10px] text-stone-400 block">
              {state.sourceType === 'synth' ? 'اجرای دقیق سنتور ایرانی' : 'فایل ضبط شده'}
            </span>
          </div>
        </div>

        {/* Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1 w-full sm:w-1/2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (state.isPlaying ? globalAudioPlayer.pause() : globalAudioPlayer.play())}
              className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center transition-colors shadow-sm"
              aria-label={state.isPlaying ? 'توقف' : 'پخش'}
            >
              {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current mr-0.5" />}
            </button>
            <button
              onClick={() => globalAudioPlayer.stop()}
              className="p-1.5 text-stone-400 hover:text-white transition-colors"
              aria-label="توقف کامل"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full max-w-md text-[10px] text-stone-400 font-mono">
            <span>{formatTime(state.currentTime)}</span>
            <input
              type="range"
              min="0"
              max={state.duration || 100}
              step="0.1"
              value={state.currentTime}
              onChange={handleSeek}
              disabled={state.duration === 0}
              className="flex-1 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2 w-1/4 justify-end text-xs text-stone-400">
          <Volume2 className="w-4 h-4" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.volume}
            onChange={handleVolume}
            className="w-20 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      </div>
    </div>
  );
};
