/**
 * کامپوننت مصورسازی پرده‌بندی و درجات مدال دستگاه
 * با پشتیبانی از پخش صوتی هر نت، نمایش فرکانس دقیق مدال و توضیحات علمی فواصل
 */

import React, { useState } from 'react';
import { Volume2, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { persianSynth } from '../services/audio/synthPlayer';
import { getNoteFrequencyByName } from '../services/audio/persianScale';

export interface ScaleVisualizerNote {
  noteNameFa: string;
  roleInScale: 'پایه' | 'شاهد درآمد' | 'ایست' | 'متغیر' | 'محسوس' | 'معمولی';
  accidental?: 'natural' | 'koron' | 'sori' | 'flat' | 'sharp';
  frequencyHz?: number;
  modalExplanation?: string;
}

interface ScaleVisualizerProps {
  title: string;
  notes: ScaleVisualizerNote[];
  defaultOctave?: number;
  tuningProfileName?: string;
}

export const ScaleVisualizer: React.FC<ScaleVisualizerProps> = ({
  title,
  notes,
  defaultOctave = 4,
  tuningProfileName,
}) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [activeNoteInfo, setActiveNoteInfo] = useState<ScaleVisualizerNote | null>(null);

  const handlePlayNote = async (item: ScaleVisualizerNote, index: number) => {
    setPlayingIndex(index);
    setActiveNoteInfo(item);

    if (item.frequencyHz) {
      await persianSynth.playFrequency(item.frequencyHz, 1.4);
    } else {
      await persianSynth.playNoteByName(item.noteNameFa, defaultOctave, 1.4);
    }

    setTimeout(() => {
      setPlayingIndex((curr) => (curr === index ? null : curr));
    }, 800);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'پایه':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'شاهد درآمد':
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
      case 'ایست':
        return 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      case 'متغیر':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-base">{title}</h3>
            {tuningProfileName && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                مرجع کوک: {tuningProfileName}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            روی هر نت کلیک کنید تا فرکانس دقیق سنتور و نقش مدال آن را بشنوید
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span>شاهد</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>پایه</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>ایست</span>
          </div>
        </div>
      </div>

      {/* ردیف دکمه‌های پرده‌بندی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {notes.map((item, index) => {
          const freq = item.frequencyHz
            ? Math.round(item.frequencyHz * 10) / 10
            : Math.round(getNoteFrequencyByName(item.noteNameFa, defaultOctave));
          const isPlaying = playingIndex === index;
          const isKoron = item.accidental === 'koron';

          return (
            <button
              key={index}
              onClick={() => handlePlayNote(item, index)}
              className={`relative flex flex-col items-center justify-between p-3.5 rounded-lg border text-center transition-all focus:outline-none ${
                isPlaying
                  ? 'bg-amber-50 border-amber-500 scale-105 shadow-md ring-2 ring-amber-400/50'
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

      {/* جعبه راهنمای پاپ‌آپ هنگام کلیک بر نت */}
      {activeNoteInfo && activeNoteInfo.modalExplanation && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-950 flex items-start gap-2 animate-in fade-in">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold ml-1">توضیح مدال نت «{activeNoteInfo.noteNameFa}»:</span>
            <span>{activeNoteInfo.modalExplanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
