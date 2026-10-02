/**
 * صفحه عیب‌یابی و آزمایش داخلی (Developer / QA Diagnostic Mode)
 * برای ارزیابی لایه‌های ۱، ۲ و ۳ سیستم صوتی، وضعیت AudioContext، میکروفون و سنجش تاخیر
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Sliders,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { microphoneManager, MicrophoneStatus, MicrophoneErrorDetails } from '../services/audio/microphoneManager';
import { audioContextManager } from '../services/audio/audioContext';
import { RawPitchResult, MusicalInterpretation, TuningProfile } from '../types/music';
import {
  AVAILABLE_TUNING_PROFILES,
  VAZIRI_24TET_PROFILE,
  SHOUR_MODAL_PROFILE,
  SEGAH_MODAL_PROFILE,
} from '../services/audio/pitch/tuningProfiles';
import { persianSynth } from '../services/audio/synthPlayer';
import { navigateTo } from '../router';

export const QAPage: React.FC = () => {
  const [micStatus, setMicStatus] = useState<MicrophoneStatus>(microphoneManager.getStatus());
  const [micError, setMicError] = useState<MicrophoneErrorDetails | undefined>();
  const [audioCtxState, setAudioCtxState] = useState<string>('uninitialized');
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [selectedProfile, setSelectedProfile] = useState<TuningProfile>(VAZIRI_24TET_PROFILE);

  const [rawPitch, setRawPitch] = useState<RawPitchResult | null>(null);
  const [interpretation, setInterpretation] = useState<MusicalInterpretation | null>(null);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [lastProcessTimeMs, setLastProcessTimeMs] = useState<number>(0);

  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = microphoneManager.subscribe((status, error) => {
      setMicStatus(status);
      setMicError(error);
      setAudioCtxState(microphoneManager.getAudioContextState());
      setSampleRate(microphoneManager.getSampleRate());
    });

    return () => {
      unsub();
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      // اطمینان از پاکسازی میکروفون هنگام ترک صفحه QA
      microphoneManager.stop();
    };
  }, []);

  // حلقه تحلیل در هر فریم
  useEffect(() => {
    const loop = () => {
      if (microphoneManager.isRecording()) {
        const t0 = performance.now();
        const raw = microphoneManager.getRawPitch();
        const interp = microphoneManager.getMusicalInterpretation(null, 20);
        const t1 = performance.now();

        setRawPitch(raw);
        setInterpretation(interp);
        setLastProcessTimeMs(Math.round((t1 - t0) * 100) / 100);
        setFrameCount((prev) => prev + 1);
        setAudioCtxState(microphoneManager.getAudioContextState());
      }
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleToggleMic = async () => {
    if (microphoneManager.isRecording()) {
      microphoneManager.stop();
      setRawPitch(null);
      setInterpretation(null);
    } else {
      await microphoneManager.start();
    }
  };

  const handleResumeAudioContext = async () => {
    await audioContextManager.resumeContext();
    setAudioCtxState(microphoneManager.getAudioContextState());
  };

  const handleProfileChange = (profile: TuningProfile) => {
    setSelectedProfile(profile);
    microphoneManager.setTuningProfile(profile);
  };

  const playTestTone = async (freq: number) => {
    await persianSynth.playTone({
      frequency: freq,
      durationSeconds: 2.0,
      volume: 0.4,
      instrument: 'santur',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-28 text-stone-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <button
            onClick={() => navigateTo('/home')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به سایت اصلی</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-stone-900">
              کنسول ارزیابی و عیب‌یابی فنی (Deep QA Diagnostic)
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
              DEV / QA MODE
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            نظارت بلادرنگ بر لایه‌های سه‌گانه پردازش صوت (Raw Pitch ➔ Tuning Profile ➔ Interpretation)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResumeAudioContext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بازنشانی AudioContext</span>
          </button>

          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              micStatus === 'recording'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
            }`}
          >
            {micStatus === 'recording' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{micStatus === 'recording' ? 'قطع میکروفون' : 'فعال‌سازی میکروفون'}</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {micError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">کد خطا: {micError.code}</span>
            <span className="block mt-0.5">{micError.messageFa}</span>
          </div>
        </div>
      )}

      {/* System Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-400 block mb-1">وضعیت AudioContext</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                audioCtxState === 'running'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-mono text-sm font-bold capitalize">{audioCtxState}</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-2 block font-mono">
            نرخ نمونه‌برداری: {sampleRate} Hz
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-400 block mb-1">وضعیت میکروفون</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                micStatus === 'recording'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-stone-400'
              }`}
            />
            <span className="font-mono text-sm font-bold capitalize">{micStatus}</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-2 block font-mono">
            تعداد فریم رندر: {frameCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-400 block mb-1">زمان پردازش الگوریتم (Latency)</span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-stone-900">{lastProcessTimeMs}</span>
            <span className="text-xs text-stone-500">ms</span>
          </div>
          <span className="text-[10px] text-emerald-700 mt-2 block">
            {lastProcessTimeMs < 5 ? '✓ بسیار سریع (<5ms)' : 'هشدار تاخیر'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-400 block mb-1">آزمایش با صدای واقعی سخت‌افزار</span>
          <span className="text-xs font-semibold text-stone-800 block">
            {typeof navigator !== 'undefined' && navigator.mediaDevices ? 'API در دسترس است' : 'مرورگر فاقد پشتیبانی'}
          </span>
          <span className="text-[10px] text-stone-500 mt-2 block">
            نیازمند تایید کاربر در Prompt مرورگر
          </span>
        </div>
      </div>

      {/* 3-Layer Diagnostic Stack */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-600" />
          <span>بررسی لایه‌های سه‌گانه موتور تحلیل صوت (Pitch Engine)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Layer 1: Raw Pitch */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900">لایه ۱: فرکانس خام (Raw Pitch)</span>
              <span className="text-[10px] font-mono text-stone-400">YIN CMNDF</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">فرکانس فیزیکی:</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {rawPitch ? `${rawPitch.frequencyHz} Hz` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">شدت انرژی (RMS):</span>
                <span className="font-mono font-bold text-stone-900">
                  {rawPitch ? `${Math.round(rawPitch.rmsVolume * 100)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">درصد قطعیت (Confidence):</span>
                <span className="font-mono font-bold text-stone-900">
                  {rawPitch ? `${Math.round(rawPitch.confidence * 100)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">وضعیت واک (Voiced):</span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    rawPitch?.isVoiced
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {rawPitch?.isVoiced ? 'واک‌دار (Voiced)' : 'سکوت / نویز'}
                </span>
              </div>
            </div>
          </div>

          {/* Layer 2: Tuning Profile Reference */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900">لایه ۲: مرجع کوک (Tuning Profile)</span>
              <span className="text-[10px] font-mono text-stone-400">Reference Mode</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">انتخاب پروفایل مرجع:</label>
                <select
                  value={selectedProfile.id}
                  onChange={(e) => {
                    const prof = AVAILABLE_TUNING_PROFILES.find((p) => p.id === e.target.value);
                    if (prof) handleProfileChange(prof);
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none"
                >
                  {AVAILABLE_TUNING_PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameFa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-stone-600 space-y-1 p-2.5 bg-stone-50 rounded-lg">
                <span className="font-bold block text-stone-800">منبع و استناد:</span>
                <p className="leading-relaxed">{selectedProfile.sourceCitation}</p>
                <span className="text-[10px] text-stone-400 block pt-1">
                  تعداد نتهای پروفایل: {selectedProfile.notes.length} نت
                </span>
              </div>
            </div>
          </div>

          {/* Layer 3: Musical Interpretation */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900">لایه ۳: تفسیر موسیقایی (Interpretation)</span>
              <span className="text-[10px] font-mono text-stone-400">Semantics</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">نزدیک‌ترین نت شناسایی‌شده:</span>
                <span className="font-bold text-stone-900 text-sm">
                  {interpretation ? interpretation.matchedNote.nameFa : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">فرکانس هدف نت:</span>
                <span className="font-mono font-bold text-stone-900">
                  {interpretation ? `${interpretation.targetFrequencyHz} Hz` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">انحراف به سنت (Cents):</span>
                <span
                  className={`font-mono font-bold ${
                    interpretation?.isInTune ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {interpretation
                    ? (interpretation.centsDeviation > 0
                        ? `+${interpretation.centsDeviation}¢`
                        : `${interpretation.centsDeviation}¢`)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">راهنمای کوک:</span>
                <span className="font-bold text-stone-800">
                  {interpretation ? interpretation.directionAdvice : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Tone Generator for Validation */}
      <div className="bg-stone-900 text-stone-100 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              ژنراتور فرکانس آزمایشی (Synthetic Tone Generator)
            </h3>
          </div>
          <span className="text-[11px] text-stone-400">
            برای سنجش و کالیبراسیون تشخیص فرکانس، روی هر نت کلیک کنید
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { label: 'سل ۴ (G4 - 392Hz)', freq: 392.0 },
            { label: 'لا کُرُن ۴ (A𝄳4 - 426.2Hz)', freq: 426.2 },
            { label: 'لا ۴ (A4 - 440Hz)', freq: 440.0 },
            { label: 'سی بمل ۴ (Bb4 - 466.16Hz)', freq: 466.16 },
            { label: 'دو ۵ (C5 - 523.25Hz)', freq: 523.25 },
            { label: 'می کُرُن ۴ (E𝄳4 - 320.24Hz)', freq: 320.24 },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => playTestTone(item.freq)}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-300 font-mono text-xs transition-colors border border-stone-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
