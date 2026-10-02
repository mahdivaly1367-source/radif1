import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, Sparkles, CheckCircle2, RotateCcw, VolumeX } from 'lucide-react';
import { microphoneManager, MicrophoneStatus, MicrophoneErrorDetails } from '../services/audio/microphoneManager';
import { PitchDetectionResult, ExerciseTargetNote } from '../types/music';
import { persianSynth } from '../services/audio/synthPlayer';

interface PersianTunerProps {
  targetNote?: ExerciseTargetNote | null;
  onMatchSuccess?: (score: number, averageCents: number) => void;
  showCanvasGraph?: boolean;
}

export const PersianTuner: React.FC<PersianTunerProps> = ({
  targetNote = null,
  onMatchSuccess,
  showCanvasGraph = true,
}) => {
  const [micStatus, setMicStatus] = useState<MicrophoneStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [livePitch, setLivePitch] = useState<PitchDetectionResult | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [inTuneStreakMs, setInTuneStreakMs] = useState<number>(0);
  const [matchProgress, setMatchProgress] = useState<number>(0); // 0 to 100%

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const inTuneAccumulatorRef = useRef<number>(0);
  const centsAccumulatorRef = useRef<{ totalCents: number; count: number }>({ totalCents: 0, count: 0 });

  // مدیریت تغییرات وضعیت میکروفون
  useEffect(() => {
    const unsub = microphoneManager.subscribe((status: MicrophoneStatus, error?: MicrophoneErrorDetails) => {
      setMicStatus(status);
      if (status === 'error' && error) {
        setErrorMessage(error.messageFa);
      } else {
        setErrorMessage(null);
      }
    });

    return () => {
      unsub();
      microphoneManager.stop();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // شروع / توقف میکروفون
  const toggleMicrophone = async () => {
    if (micStatus === 'recording') {
      microphoneManager.stop();
      setLivePitch(null);
      setLiveVolume(0);
      setMatchProgress(0);
      inTuneAccumulatorRef.current = 0;
    } else {
      setErrorMessage(null);
      const success = await microphoneManager.start();
      if (success) {
        lastTimeRef.current = Date.now();
      }
    }
  };

  // حلقه رندر پیوسته برای آنالیز صوت و رسم گراف کانواس
  const updateLoop = useCallback(() => {
    if (microphoneManager.getStatus() === 'recording') {
      const now = Date.now();
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const pitch = microphoneManager.getLivePitch(targetNote ? targetNote.centsTolerance : 20);
      const vol = microphoneManager.getLiveVolume();

      setLiveVolume(vol);
      setLivePitch(pitch);

      // ذخیره در تاریخچه فرکانس برای نمودار
      const history = pitchHistoryRef.current;
      if (pitch) {
        history.push(pitch.frequency);
      } else {
        history.push(0); // سکوت
      }
      if (history.length > 120) {
        history.shift();
      }

      // اگر نت هدفی وجود دارد، سنجش انطباق فرکانسی و پایداری صدا
      if (targetNote && pitch) {
        // آیا فرکانس نزدیک به نت هدف است؟
        const freqRatio = pitch.frequency / targetNote.frequencyHz;
        const semitoneDist = Math.abs(12 * Math.log2(freqRatio));

        // اگر در محدوده نیم‌پرده‌ای نت هدف بود و درون تلرانس سنت است
        if (semitoneDist < 0.6 && pitch.isInTune) {
          inTuneAccumulatorRef.current += deltaMs;
          centsAccumulatorRef.current.totalCents += Math.abs(pitch.centsDeviation);
          centsAccumulatorRef.current.count += 1;

          const progress = Math.min(100, Math.round((inTuneAccumulatorRef.current / (targetNote.durationMs * 0.7)) * 100));
          setMatchProgress(progress);
          setInTuneStreakMs(inTuneAccumulatorRef.current);

          if (progress >= 100 && onMatchSuccess) {
            const avgCents = centsAccumulatorRef.current.count > 0
              ? Math.round(centsAccumulatorRef.current.totalCents / centsAccumulatorRef.current.count)
              : 10;
            const score = Math.max(60, 100 - avgCents * 2);
            onMatchSuccess(score, avgCents);
            inTuneAccumulatorRef.current = 0;
            centsAccumulatorRef.current = { totalCents: 0, count: 0 };
          }
        } else {
          // افت آرام پیشرفت در صورت خروج از کوک
          inTuneAccumulatorRef.current = Math.max(0, inTuneAccumulatorRef.current - deltaMs * 0.5);
          const progress = Math.min(100, Math.round((inTuneAccumulatorRef.current / (targetNote.durationMs * 0.7)) * 100));
          setMatchProgress(progress);
          setInTuneStreakMs(inTuneAccumulatorRef.current);
        }
      }

      // رسم نمودار کانواس
      drawCanvas();
    }

    animFrameRef.current = requestAnimationFrame(updateLoop);
  }, [targetNote, onMatchSuccess]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [updateLoop]);

  // رسم نمودار زنده موج و فرکانس بر روی Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // خطوط پس‌زمینه
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();

    // اگر نت هدفی داریم، خط افقی فرکانس هدف را رسم کن
    if (targetNote) {
      const targetFreq = targetNote.frequencyHz;
      // بازه نمایش مثلاً 150 تا 600 هرتز
      const minF = 120;
      const maxF = 650;
      const targetY = height - ((targetFreq - minF) / (maxF - minF)) * height;

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(width, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#059669';
      ctx.font = '10px Vazirmatn, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`هدف: ${targetNote.noteFa} (${Math.round(targetFreq)}Hz)`, 8, Math.max(14, targetY - 4));
    }

    // رسم منحنی پیوسته فرکانس کاربر
    const history = pitchHistoryRef.current;
    if (history.length > 1) {
      const minF = 120;
      const maxF = 650;

      ctx.beginPath();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      let started = false;
      for (let i = 0; i < history.length; i++) {
        const x = (i / (history.length - 1)) * width;
        const f = history[i];

        if (f > 0) {
          const y = height - ((f - minF) / (maxF - minF)) * height;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }
  };

  const playTargetReferenceTone = async () => {
    if (targetNote) {
      await persianSynth.playTone({
        frequency: targetNote.frequencyHz,
        durationSeconds: 2.2,
        volume: 0.5,
        instrument: 'santur',
      });
    }
  };

  // راهنمایی صوتی متنی
  const getDirectionFeedback = () => {
    if (!livePitch) return 'در حال آماده‌باش؛ بخوانید یا ساز بزنید...';
    if (!targetNote) {
      return livePitch.isInTune
        ? 'کوک دقیق است!'
        : livePitch.centsDeviation > 0
        ? `کمی زیرتر (${livePitch.centsDeviation}+ سنت)`
        : `کمی بم‌تر (${livePitch.centsDeviation} سنت)`;
    }

    const diff = livePitch.frequency - targetNote.frequencyHz;
    if (Math.abs(diff) < 3 && livePitch.isInTune) {
      return 'بسیار عالی! دقیقاً روی کوک هدف قرار دارید.';
    }
    if (diff < -3) {
      return 'کمی صدا را بالاتر (زیرتر) ببرید ⇧';
    }
    return 'کمی صدا را پایین‌تر (بم‌تر) ببرید ⇩';
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="bg-stone-900 text-stone-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              micStatus === 'recording'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            {micStatus === 'recording' ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-base text-white">تیونر و سنجش فرکانس موسیقی ایرانی</h3>
            <p className="text-xs text-stone-400">
              تشخیص بلادرنگ فواصل ربع‌پرده‌ای (کُرُن و سُری) با دقت صدم هرتز
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {targetNote && (
            <button
              onClick={playTargetReferenceTone}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 rounded-lg transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>شنیدن نت هدف</span>
            </button>
          )}

          <button
            onClick={toggleMicrophone}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
              micStatus === 'recording'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
            }`}
          >
            {micStatus === 'recording' ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>توقف میکروفون</span>
              </>
            ) : micStatus === 'requesting' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                <span>درخواست مجوز...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>روشن کردن میکروفون</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert if permission failed */}
      {errorMessage && (
        <div className="m-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block">اشکال در اتصال به میکروفون:</span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Tuner Stage */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Main Display: Current Note & Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-stone-50 rounded-xl p-5 border border-stone-200/80">
          {/* Target Note Display (if applicable) */}
          <div className="text-center md:text-right border-b md:border-b-0 md:border-l border-stone-200 pb-3 md:pb-0 md:pl-4">
            <span className="text-xs text-stone-500 block mb-1">الگوی نت هدف</span>
            {targetNote ? (
              <div>
                <span className="text-xl font-black text-stone-900 block">
                  {targetNote.noteFa}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  {Math.round(targetNote.frequencyHz)} Hz ({targetNote.westernName})
                </span>
              </div>
            ) : (
              <span className="text-xs text-stone-400">حالت تیونر آزاد</span>
            )}
          </div>

          {/* Detected Note */}
          <div className="text-center flex flex-col items-center justify-center">
            <span className="text-xs text-stone-500 mb-1">نت شناسایی‌شده صدای شما</span>
            <div className="relative inline-block">
              <span
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight transition-colors ${
                  livePitch?.isInTune
                    ? 'text-emerald-600'
                    : livePitch
                    ? 'text-amber-600'
                    : 'text-stone-400'
                }`}
              >
                {livePitch ? livePitch.closestNoteFa : '— —'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-stone-600">
                {livePitch ? `${livePitch.frequency} Hz` : '0 Hz'}
              </span>
              {livePitch && (
                <span className="text-[11px] text-stone-400">
                  ({livePitch.closestWesternNote})
                </span>
              )}
            </div>
          </div>

          {/* Deviation & Tuner Needle Status */}
          <div className="text-center md:text-left border-t md:border-t-0 md:border-r border-stone-200 pt-3 md:pt-0 md:pr-4">
            <span className="text-xs text-stone-500 block mb-1">انحراف کوک (سِنت)</span>
            <div className="flex items-baseline justify-center md:justify-start gap-1">
              <span
                className={`text-2xl font-bold font-mono ${
                  livePitch?.isInTune
                    ? 'text-emerald-600'
                    : livePitch
                    ? 'text-stone-800'
                    : 'text-stone-400'
                }`}
              >
                {livePitch
                  ? (livePitch.centsDeviation > 0 ? `+${livePitch.centsDeviation}` : livePitch.centsDeviation)
                  : '0'}
              </span>
              <span className="text-xs text-stone-500">¢</span>
            </div>
            <span
              className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                livePitch?.isInTune
                  ? 'bg-emerald-100 text-emerald-800'
                  : livePitch
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {livePitch?.isInTune ? 'کوک عالی' : livePitch ? 'خارج از مرکز' : 'بدون سیگنال'}
            </span>
          </div>
        </div>

        {/* Graphical Needle Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
            <span>-۵۰ سنت (بم‌تر)</span>
            <span className="font-bold text-emerald-700">ناحیه کوک دقیق (۰)</span>
            <span>+۵۰ سنت (زیرتر)</span>
          </div>

          {/* Cent Meter Bar */}
          <div className="relative h-6 bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
            {/* Safe In-tune Zone */}
            <div className="absolute top-0 bottom-0 left-[42%] right-[42%] bg-emerald-500/15 border-x border-emerald-500/40" />
            <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-stone-400 z-10" />

            {/* Moving Indicator */}
            {livePitch && (
              <div
                className="absolute top-0 bottom-0 w-2.5 rounded-sm transition-all duration-75 z-20"
                style={{
                  left: `calc(${50 + (livePitch.centsDeviation / 50) * 45}% - 5px)`,
                  backgroundColor: livePitch.isInTune ? '#059669' : '#d97706',
                  boxShadow: '0 0 8px rgba(0,0,0,0.2)',
                }}
              />
            )}
          </div>

          <div className="text-center">
            <span className="text-xs font-medium text-stone-600">
              {getDirectionFeedback()}
            </span>
          </div>
        </div>

        {/* Volume Level / VU Meter */}
        <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200/70">
          <span className="text-xs text-stone-500 shrink-0 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            شدت صدا:
          </span>
          <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
              style={{ width: `${Math.min(100, liveVolume * 120)}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-stone-400 w-10 text-left">
            {Math.round(liveVolume * 100)}%
          </span>
        </div>

        {/* Progress Bar for Exercise Matching */}
        {targetNote && (
          <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-950">
                پایداری صدا بر روی نت هدف:
              </span>
              <span className="font-bold text-amber-800 font-mono">{matchProgress}%</span>
            </div>
            <div className="w-full h-3 bg-amber-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150 rounded-full"
                style={{ width: `${matchProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-amber-800/80">
              صدا را پیوسته روی این فرکانس نگه دارید تا نوار به ۱۰۰٪ برسد.
            </p>
          </div>
        )}

        {/* Real-time Pitch Canvas Graph */}
        {showCanvasGraph && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-stone-700">
                نمودار نوسان فرکانس صوتی در زمان:
              </span>
              <span className="text-[10px] text-stone-400">
                فرکانس‌های آواز (۱۲۰ تا ۶۵۰ هرتز)
              </span>
            </div>
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-900/5">
              <canvas
                ref={canvasRef}
                width={700}
                height={140}
                className="w-full h-28 sm:h-36 block"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
