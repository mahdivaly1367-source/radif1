import React, { useState } from 'react';
import { Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { persianSynth } from '../services/audio/synthPlayer';
import { getNoteFrequencyByName } from '../services/audio/persianScale';

interface ScaleVisualizerProps {
  title: string;
  notes: {
    noteNameFa: string;
    roleInScale: 'پایه' | 'شاهد درآمد' | 'ایست' | 'متغیر' | 'محسوس' | 'معمولی';
    accidental?: 'natural' | 'koron' | 'sori' | 'flat' | 'sharp';
  }[];
  defaultOctave?: number;
}

export const ScaleVisualizer: React.FC<ScaleVisualizerProps> = ({
  title,
  notes,
  defaultOctave = 4,
}) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const handlePlayNote = async (noteName: string, index: number) => {
    setPlayingIndex(index);
    await persianSynth.playNoteByName(noteName, defaultOctave, 1.4);
    setTimeout(() => {
      setPlayingIndex((curr) => (curr === index ? null : curr));
    }, 800);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'پایه':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'شاهد درآمد':
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
      case 'ایست':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'متغیر':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-base">{title}</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            برای شنیدن صدای دقیق هر نت با پرده‌بندی سنتور، روی کارت نت کلیک کنید
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500" />
          <span>شاهد</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" />
          <span>پایه</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 mr-2" />
          <span>ایست</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {notes.map((item, index) => {
          const freq = Math.round(getNoteFrequencyByName(item.noteNameFa, defaultOctave));
          const isPlaying = playingIndex === index;
          const isKoron = item.accidental === 'koron';

          return (
            <button
              key={index}
              onClick={() => handlePlayNote(item.noteNameFa, index)}
              className={`relative flex flex-col items-center justify-between p-3.5 rounded-lg border text-center transition-all focus:outline-none ${
                isPlaying
                  ? 'bg-amber-50 border-amber-500 scale-105 shadow-md'
                  : 'bg-stone-50/70 hover:bg-stone-100/80 border-stone-200 hover:border-stone-300'
              }`}
            >
              {isKoron && (
                <span className="absolute -top-2 right-2 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full">
                  کُرُن 𝄳
                </span>
              )}

              <div className="my-1">
                <span className="text-base font-extrabold text-stone-900 block">
                  {item.noteNameFa}
                </span>
                <span className="text-[11px] text-stone-500 font-mono tracking-tight block">
                  {freq} Hz
                </span>
              </div>

              <div className="w-full pt-2 border-t border-stone-200/60 mt-1 flex flex-col items-center gap-1">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border leading-tight ${getRoleBadge(
                    item.roleInScale
                  )}`}
                >
                  {item.roleInScale}
                </span>
                <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                  <Volume2 className={`w-3 h-3 ${isPlaying ? 'text-amber-600 animate-bounce' : ''}`} />
                  پخش
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
