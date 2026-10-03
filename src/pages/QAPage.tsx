/**
 * آزمایشگاه تخصصی ارزیابی صوتی و کالیبراسیون میکروفون (Real Microphone QA & Pitch Calibration)
 * 
 * شامل:
 * ۱. پایش بلادرنگ وضعیت میکروفون، دستگاه ورودی، نرخ نمونه‌برداری و AudioContext
 * ۲. آزمون کنترل‌شده حلقه بسته فرکانس‌های سینت‌سایزر (Synthetic Loopback Tester) و جدول کالیبراسیون
 * ۳. تست میکروفون واقعی همراه با دستورالعمل ۴ مرحله‌ای (سکوت، نت کشیده، نت زیر، نت بم)
 * ۴. ابزار ضبط نمونه‌های Pitch و محاسبه آماری (میانگین، میانه، حداقل، حداکثر، پایداری فرکانسی)
 * ۵. نمودار زمان-فرکانس ساده برای QA
 * ۶. پروفایل‌های کوک مرجع (Reference Tuning Profiles)
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Activity,
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Play,
  Square,
  BarChart2,
  Sliders,
  Info,
  Clock,
  Cpu,
  ShieldCheck,
  Headphones,
  Check,
  X,
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
import {
  SyntheticPitchTester,
  SyntheticTestResult,
} from '../services/audio/pitch/syntheticPitchTester';
import { navigateTo } from '../router';

interface SamplePoint {
  timestamp: number;
  frequencyHz: number;
  confidence: number;
  rms: number;
  voiced: boolean;
}

interface UserCalibrationEntry {
  id: string;
  testName: string;
  expectedDescription: string;
  measuredFrequencyHz: number;
  centsDeviation: number;
  confidence: number;
  voiced: boolean;
  status: 'PASS' | 'FAIL';
  note: string;
}

export const QAPage: React.FC = () => {
  // ۱. وضعیت سخت‌افزار و سیستم صوتی
  const [micStatus, setMicStatus] = useState<MicrophoneStatus>(microphoneManager.getStatus());
  const [micError, setMicError] = useState<MicrophoneErrorDetails | undefined>();
  const [permissionStatus, setPermissionStatus] = useState<string>('بررسی...');
  const [inputDeviceLabel, setInputDeviceLabel] = useState<string>('میکروفون غیرفعال است');
  const [channelCount, setChannelCount] = useState<number>(0);
  const [audioCtxState, setAudioCtxState] = useState<string>('uninitialized');
  const [sampleRate, setSampleRate] = useState<number>(44100);

  // ۲. وضعیت لایه‌های سه‌گانه
  const [selectedProfile, setSelectedProfile] = useState<TuningProfile>(VAZIRI_24TET_PROFILE);
  const [liveRawPitch, setLiveRawPitch] = useState<RawPitchResult | null>(null);
  const [liveInterpretation, setLiveInterpretation] = useState<MusicalInterpretation | null>(null);
  const [processTimeMs, setProcessTimeMs] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  // ۳. نتایج آزمون سینت‌سایزر (Synthetic Loopback)
  const [syntheticResults, setSyntheticResults] = useState<SyntheticTestResult[]>([]);
  const [isRunningSyntheticSuite, setIsRunningSyntheticSuite] = useState(false);
  const [audibleSynthTest, setAudibleSynthTest] = useState(false);

  // ۴. نشست نمونه‌برداری QA (Sampling Session)
  const [isSamplingActive, setIsSamplingActive] = useState(false);
  const [sampledData, setSampledData] = useState<SamplePoint[]>([]);
  const [samplingStats, setSamplingStats] = useState<{
    count: number;
    durationSec: number;
    minFreq: number;
    maxFreq: number;
    avgFreq: number;
    medianFreq: number;
    voicedPercentage: number;
    avgConfidence: number;
    stabilityStdDev: number;
  } | null>(null);

  // ۵. جدول کالیبراسیون و تست‌های ثبت‌شده کاربر
  const [userCalibrationLogs, setUserCalibrationLogs] = useState<UserCalibrationEntry[]>([]);

  // مراجع انیمیشن و تایمرها
  const animRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCounterRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveBufferRef = useRef<number[]>([]);

  // استعلام وضعیت اولیه مجوزها و سیستم
  useEffect(() => {
    microphoneManager.getPermissionStatus().then((status) => {
      setPermissionStatus(status);
    });

    const unsub = microphoneManager.subscribe((status, error) => {
      setMicStatus(status);
      setMicError(error);
      setAudioCtxState(microphoneManager.getAudioContextState());
      setSampleRate(microphoneManager.getSampleRate());
      setInputDeviceLabel(microphoneManager.getInputDeviceLabel());
      setChannelCount(microphoneManager.getChannelCount());
      microphoneManager.getPermissionStatus().then((s) => setPermissionStatus(s));
    });

    return () => {
      unsub();
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      // اطمینان از پاکسازی نشت استریم میکروفون
      microphoneManager.stop();
    };
  }, []);

  // حلقه پردازش با فرکانس مناسب بدون افت کارایی و خارج از چرخه رندر مستقیم
  useEffect(() => {
    const loop = (now: number) => {
      if (microphoneManager.isRecording()) {
        const delta = now - lastFrameTimeRef.current;
        // به‌روزرسانی حدود ۳۵ فریم بر ثانیه برای کاهش مصرف CPU
        if (delta >= 28) {
          lastFrameTimeRef.current = now;

          const t0 = performance.now();
          const raw = microphoneManager.getRawPitch();
          const interp = microphoneManager.getMusicalInterpretation(null, 20);
          const t1 = performance.now();

          setLiveRawPitch(raw);
          setLiveInterpretation(interp);
          setProcessTimeMs(Math.round((t1 - t0) * 100) / 100);

          // ثبت فریم در بافر زنده نمودار
          if (raw) {
            liveBufferRef.current.push(raw.isVoiced ? raw.frequencyHz : 0);
            if (liveBufferRef.current.length > 150) {
              liveBufferRef.current.shift();
            }

            // اگر نمونه‌برداری فعال است
            if (isSamplingActive) {
              setSampledData((prev) => [
                ...prev,
                {
                  timestamp: raw.timestamp,
                  frequencyHz: raw.frequencyHz,
                  confidence: raw.confidence,
                  rms: raw.rmsVolume,
                  voiced: raw.isVoiced,
                },
              ]);
            }
          }

          // محاسبه نرخ فریم
          frameCounterRef.current++;
          if (now - lastFpsUpdateRef.current >= 1000) {
            setFps(frameCounterRef.current);
            frameCounterRef.current = 0;
            lastFpsUpdateRef.current = now;
          }
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSamplingActive]);

  // رسم نمودار زنده زمان-فرکانس روی Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // پس‌زمینه تیره شبکه
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, width, height);

    // خطوط افقی راهنمای فرکانس (C3: 130Hz, C4: 261Hz, A4: 440Hz, C5: 523Hz)
    const guides = [
      { hz: 200, label: '200 Hz' },
      { hz: 320, label: '320 Hz (می کُرُن)' },
      { hz: 440, label: '440 Hz (لا ۴)' },
      { hz: 600, label: '600 Hz' },
    ];

    const minFreq = 100;
    const maxFreq = 750;

    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#78716c';
    ctx.font = '10px monospace';

    guides.forEach((g) => {
      const y = height - ((g.hz - minFreq) / (maxFreq - minFreq)) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.fillText(g.label, 10, y - 3);
    });

    const data = liveBufferRef.current;
    if (data.length < 2) return;

    const step = width / (data.length - 1);

    // رسم نقاط و خطوط به تفکیک Voiced / Unvoiced
    ctx.beginPath();
    ctx.lineWidth = 2.5;

    let inPath = false;
    for (let i = 0; i < data.length; i++) {
      const freq = data[i];
      const x = i * step;

      if (freq > 0) {
        const clampedFreq = Math.max(minFreq, Math.min(maxFreq, freq));
        const y = height - ((clampedFreq - minFreq) / (maxFreq - minFreq)) * height;

        if (!inPath) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          inPath = true;
        } else {
          ctx.lineTo(x, y);
        }

        // کشیدن نقطه زرد روشن
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      } else {
        if (inPath) {
          ctx.strokeStyle = '#f59e0b';
          ctx.stroke();
          inPath = false;
        }
      }
    }

    if (inPath) {
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();
    }
  }, [liveRawPitch]);

  // شروع / توقف میکروفون
  const handleToggleMic = async () => {
    if (microphoneManager.isRecording()) {
      microphoneManager.stop();
      setLiveRawPitch(null);
      setLiveInterpretation(null);
    } else {
      await microphoneManager.start();
    }
  };

  // تعویض پروفایل کوک مرجع
  const handleProfileChange = (profile: TuningProfile) => {
    setSelectedProfile(profile);
    microphoneManager.setTuningProfile(profile);
  };

  // بازنشانی AudioContext
  const handleResumeAudioContext = async () => {
    await audioContextManager.resumeContext();
    setAudioCtxState(microphoneManager.getAudioContextState());
  };

  // اجرای آزمون خودکار فرکانس‌های سینت‌سایزر
  const handleRunSyntheticSuite = async () => {
    setIsRunningSyntheticSuite(true);
    try {
      const results = await SyntheticPitchTester.runStandardSuite();
      setSyntheticResults(results);
    } catch (e) {
      console.error('Synthetic suite test error:', e);
    } finally {
      setIsRunningSyntheticSuite(false);
    }
  };

  // تست تک‌فرکانس سینت‌سایزر
  const handleTestSingleSynthTone = async (freq: number) => {
    const res = await SyntheticPitchTester.testFrequency(freq, audibleSynthTest);
    setSyntheticResults((prev) => {
      const filtered = prev.filter((p) => p.frequencyHz !== freq);
      return [...filtered, res].sort((a, b) => a.frequencyHz - b.frequencyHz);
    });
  };

  // کنترل نمونه‌برداری QA
  const handleStartSampling = () => {
    setSampledData([]);
    setSamplingStats(null);
    setIsSamplingActive(true);
  };

  const handleStopSampling = () => {
    setIsSamplingActive(false);

    // محاسبه تحلیل آماری
    if (sampledData.length === 0) return;

    const voicedPoints = sampledData.filter((p) => p.voiced && p.frequencyHz > 0);
    const voicedCount = voicedPoints.length;
    const totalCount = sampledData.length;

    if (voicedCount === 0) {
      setSamplingStats({
        count: totalCount,
        durationSec: Math.round((totalCount * 0.03) * 10) / 10,
        minFreq: 0,
        maxFreq: 0,
        avgFreq: 0,
        medianFreq: 0,
        voicedPercentage: 0,
        avgConfidence: 0,
        stabilityStdDev: 0,
      });
      return;
    }

    const freqs = voicedPoints.map((p) => p.frequencyHz).sort((a, b) => a - b);
    const minFreq = freqs[0];
    const maxFreq = freqs[freqs.length - 1];
    const sumFreq = freqs.reduce((acc, v) => acc + v, 0);
    const avgFreq = Math.round((sumFreq / voicedCount) * 10) / 10;
    const medianFreq = freqs[Math.floor(voicedCount / 2)];

    const confSum = voicedPoints.reduce((acc, v) => acc + v.confidence, 0);
    const avgConfidence = Math.round((confSum / voicedCount) * 100);

    // محاسبه انحراف معیار (Standard Deviation) به عنوان شاخص پایداری فرکانس
    const variance =
      freqs.reduce((acc, v) => acc + Math.pow(v - avgFreq, 2), 0) / voicedCount;
    const stabilityStdDev = Math.round(Math.sqrt(variance) * 100) / 100;

    setSamplingStats({
      count: totalCount,
      durationSec: Math.round(totalCount * 0.03 * 10) / 10,
      minFreq,
      maxFreq,
      avgFreq,
      medianFreq,
      voicedPercentage: Math.round((voicedCount / totalCount) * 100),
      avgConfidence,
      stabilityStdDev,
    });
  };

  // ثبت آزمون دستی در جدول کالیبراسیون
  const handleLogUserTest = (testType: 'A' | 'B' | 'C' | 'D') => {
    const raw = liveRawPitch;
    const interp = liveInterpretation;

    const testMeta = {
      A: { name: 'Test A — Silence (سکوت)', desc: 'سکوت محیطی (باید Voiced=false باشد)' },
      B: { name: 'Test B — Sustained Note (نت ممتد)', desc: 'خوانش «آ» یکنواخت (پایداری فرکانس)' },
      C: { name: 'Test C — Higher Note (نت زیرتر)', desc: 'صعود به گستره بالاتر (بررسی عدم جهش اکتاو)' },
      D: { name: 'Test D — Lower Note (نت بم‌تر)', desc: 'فرود به گستره بم‌تر (پایداری در فرکانس بم)' },
    }[testType];

    let passed = false;
    let note = '';

    if (testType === 'A') {
      passed = !raw || !raw.isVoiced || raw.rmsVolume < 0.015;
      note = passed ? 'سکوت با موفقیت فیلتر شد' : 'هشدار: نویز محیطی به عنوان واک تشخیص داده شد';
    } else {
      passed = !!(raw && raw.isVoiced && raw.confidence >= 0.65);
      note = passed
        ? `ثبت فرکانس ${raw?.frequencyHz}Hz با قطعیت ${Math.round((raw?.confidence ?? 0) * 100)}%`
        : 'سیگنال کافی برای واک پایدار دریافت نشد';
    }

    const newEntry: UserCalibrationEntry = {
      id: `${testType}-${Date.now()}`,
      testName: testMeta.name,
      expectedDescription: testMeta.desc,
      measuredFrequencyHz: raw ? raw.frequencyHz : 0,
      centsDeviation: interp ? interp.centsDeviation : 0,
      confidence: raw ? Math.round(raw.confidence * 100) : 0,
      voiced: raw ? raw.isVoiced : false,
      status: passed ? 'PASS' : 'FAIL',
      note,
    };

    setUserCalibrationLogs((prev) => [newEntry, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28 text-stone-900">
      {/* هدر صفحه و ناوبری بازگشت */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <button
            onClick={() => navigateTo('/home')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به سایت اصلی</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-stone-900">
              آزمایشگاه عیب‌یابی صوتی و کالیبراسیون میکروفون
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
              REAL AUDIO QA LAB
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            آزمایش دقیق سخت‌افزار میکروفون کاربر، تست فرکانس‌های سینت‌سایزر، کالیبراسیون YIN CMNDF و ثبت داده‌های صوتی.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResumeAudioContext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
            title="بازنشانی در صورت تعلیق سیاست خودکار مرورگر"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>AudioContext</span>
          </button>

          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
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

      {/* هشدار در صورت بروز خطا در دسترسی به میکروفون */}
      {micError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">خطای ورودی صوتی: {micError.code}</span>
            <span className="block mt-0.5">{micError.messageFa}</span>
          </div>
        </div>
      )}

      {/* بخش ۱: وضعیت سخت‌افزار و مشخصات مهندسی */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-600" />
          <span>۱. مشخصات سخت‌افزاری و جریان‌های وب‌آدیو (Hardware & Web Audio Status)</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 block mb-1">اجازه مرورگر (Permission)</span>
            <span className="font-mono text-xs font-bold text-stone-900 block truncate">
              {permissionStatus}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 block mb-1">وضعیت میکروفون</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  micStatus === 'recording' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                }`}
              />
              <span className="font-mono text-xs font-bold text-stone-900 capitalize">{micStatus}</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 block mb-1">وضعیت AudioContext</span>
            <span className="font-mono text-xs font-bold text-stone-900 capitalize block">
              {audioCtxState}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 block mb-1">نرخ نمونه (Sample Rate)</span>
            <span className="font-mono text-xs font-bold text-stone-900 block">
              {sampleRate} Hz
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 block mb-1">کانال صوتی (Channels)</span>
            <span className="font-mono text-xs font-bold text-stone-900 block">
              {channelCount > 0 ? `${channelCount} کانال` : '—'}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] text-stone-400 block mb-1">کارایی (Latency / FPS)</span>
            <span className="font-mono text-xs font-bold text-stone-900 block">
              {processTimeMs}ms ({fps} fps)
            </span>
          </div>
        </div>

        <div className="bg-stone-100 p-2.5 rounded-lg text-xs text-stone-600 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-stone-800">دستگاه ورودی فعال:</span>
            <span className="font-mono text-stone-600 truncate">{inputDeviceLabel}</span>
          </div>
          <span className="text-[10px] text-stone-400 shrink-0 font-mono">
            FFT Buffer: 2048 samples (~46ms window)
          </span>
        </div>
      </section>

      {/* بخش ۲: آزمون فرکانس‌های سینت‌سایزر (Synthetic Loopback Tester) */}
      <section className="bg-white rounded-xl border border-stone-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>۲. آزمون فرکانس‌های خالص سینت‌سایزر (Synthetic Tone Calibration)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              تولید فرکانس‌های ریاضی خالص بدون دخالت میکروفون جهت سنجش خطای الگوریتم YIN CMNDF
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={audibleSynthTest}
                onChange={(e) => setAudibleSynthTest(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span>پخش صدا از بلندگو حین تست</span>
            </label>

            <button
              onClick={handleRunSyntheticSuite}
              disabled={isRunningSyntheticSuite}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningSyntheticSuite ? 'در حال تست...' : 'اجرای خودکار آزمون ۶ فرکانس'}</span>
            </button>
          </div>
        </div>

        {/* دکمه‌های اجرای تک فرکانس */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'می کُرُن ۴ (320.24 Hz)', freq: 320.24 },
            { label: 'سل ۴ (392.00 Hz)', freq: 392.0 },
            { label: 'لا کُرُن ۴ (426.20 Hz)', freq: 426.2 },
            { label: 'لا ۴ دیاپازون (440.00 Hz)', freq: 440.0 },
            { label: 'سی بمل ۴ (466.16 Hz)', freq: 466.16 },
            { label: 'دو ۵ (523.25 Hz)', freq: 523.25 },
          ].map((item) => (
            <button
              key={item.freq}
              onClick={() => handleTestSingleSynthTone(item.freq)}
              className="px-3 py-1 rounded-lg border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-mono text-stone-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* جدول کالیبراسیون فرکانس‌های سینت‌سایزر */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border border-stone-200 rounded-lg overflow-hidden">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-2.5">فرکانس هدف (Expected)</th>
                <th className="p-2.5">فرکانس تشخیصی (Detected)</th>
                <th className="p-2.5">خطای هرتز (Error Hz)</th>
                <th className="p-2.5">خطای سنت (Error Cents)</th>
                <th className="p-2.5">درصد قطعیت (Confidence)</th>
                <th className="p-2.5">واک (Voiced)</th>
                <th className="p-2.5">زمان پردازش</th>
                <th className="p-2.5 text-center">نتیجه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {syntheticResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-stone-400 font-sans">
                    هنوز تستی اجرا نشده است. روی «اجرای خودکار آزمون ۶ فرکانس» یا دکمه‌های بالا کلیک کنید.
                  </td>
                </tr>
              ) : (
                syntheticResults.map((r, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/60">
                    <td className="p-2.5 font-bold text-stone-900">{r.expectedHz} Hz</td>
                    <td className="p-2.5 text-stone-800">{r.detectedHz} Hz</td>
                    <td
                      className={`p-2.5 ${
                        Math.abs(r.errorHz) < 0.5 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {r.errorHz > 0 ? `+${r.errorHz}` : r.errorHz} Hz
                    </td>
                    <td
                      className={`p-2.5 ${
                        Math.abs(r.errorCents) <= 3.0 ? 'text-emerald-700' : 'text-rose-700 font-bold'
                      }`}
                    >
                      {r.errorCents > 0 ? `+${r.errorCents}¢` : `${r.errorCents}¢`}
                    </td>
                    <td className="p-2.5">{Math.round(r.confidence * 100)}%</td>
                    <td className="p-2.5">{r.voiced ? 'Voiced' : 'Unvoiced'}</td>
                    <td className="p-2.5 text-stone-500">{r.processingTimeMs} ms</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                          r.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* بخش ۳: تست میکروفون واقعی و پنل سنجش زنده */}
      <section className="bg-white rounded-xl border border-stone-200 p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-600" />
              <span>۳. تست میکروفون واقعی (Real Microphone Live Monitor)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              دریافت مستقیم موج صوتی حنجره، استخراج فرکانس و نگاشت به نتهای ایرانی
            </p>
          </div>

          {/* انتخاب پروفایل کوک مرجع */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">پروفایل مرجع:</span>
            <select
              value={selectedProfile.id}
              onChange={(e) => {
                const prof = AVAILABLE_TUNING_PROFILES.find((p) => p.id === e.target.value);
                if (prof) handleProfileChange(prof);
              }}
              className="text-xs p-1.5 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none"
            >
              {AVAILABLE_TUNING_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameFa}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* کارت‌های سنجش لحظه‌ای زنده */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* فرکانس لحظه‌ای */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block mb-1">فرکانس لحظه‌ای (Frequency)</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-black text-stone-900">
                {liveRawPitch && liveRawPitch.isVoiced ? liveRawPitch.frequencyHz : '—'}
              </span>
              <span className="text-xs text-stone-500 font-mono">Hz</span>
            </div>
            <span className="text-[10px] text-stone-400 block mt-2">
              شدت انرژی: {liveRawPitch ? `${Math.round(liveRawPitch.rmsVolume * 100)}%` : '0%'}
            </span>
          </div>

          {/* قطعیت و وضعیت واک */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block mb-1">قطعیت و وضعیت واک (Voiced)</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-2xl font-black ${
                  liveRawPitch?.isVoiced ? 'text-emerald-700' : 'text-stone-400'
                }`}
              >
                {liveRawPitch ? `${Math.round(liveRawPitch.confidence * 100)}%` : '0%'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  liveRawPitch?.isVoiced
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {liveRawPitch?.isVoiced ? 'Voiced' : 'Unvoiced'}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block mt-2">
              آستانه واک‌داری: Confidence ≥ 50%
            </span>
          </div>

          {/* نت تطبیق‌یافته */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block mb-1">نت شناسایی‌شده (Matched Note)</span>
            <span className="text-xl font-black text-amber-800 block truncate">
              {liveInterpretation ? liveInterpretation.matchedNote.nameFa : '—'}
            </span>
            <span className="text-[10px] font-mono text-stone-400 block mt-2">
              هدف: {liveInterpretation ? `${liveInterpretation.targetFrequencyHz} Hz` : '—'}
            </span>
          </div>

          {/* انحراف سنت و راهنما */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block mb-1">انحراف سنت (Cents Deviation)</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-2xl font-black ${
                  liveInterpretation?.isInTune ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {liveInterpretation
                  ? (liveInterpretation.centsDeviation > 0
                      ? `+${liveInterpretation.centsDeviation}¢`
                      : `${liveInterpretation.centsDeviation}¢`)
                  : '—'}
              </span>
              <span className="text-xs font-bold text-stone-700">
                {liveInterpretation?.isInTune ? '✓ کوک دقیق' : (liveInterpretation?.directionAdvice === 'higher' ? '↑ زیرتر' : '↓ بم‌تر')}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block mt-2">
              محدوده مجاز کوک: ±20 سنت
            </span>
          </div>
        </div>

        {/* نمودار ساده زمان-فرکانس برای نظارت زنده */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-bold text-stone-700">نمودار زنده پیوستگی فرکانس (Time-Frequency Monitor)</span>
            <span className="text-[10px] font-mono text-stone-400">
              نقاط زرد = سیگنال واک‌دار (Voiced) | خطوط خاکستری = مراجع هارمونیک
            </span>
          </div>
          <div className="rounded-xl overflow-hidden border border-stone-800 shadow-inner">
            <canvas
              ref={canvasRef}
              width={900}
              height={140}
              className="w-full h-36 block bg-stone-900"
            />
          </div>
          <p className="text-[11px] text-stone-400 italic">
            * توجه مهندسی: این نمودار جهت سنجش پیوستگی سمپل‌های YIN و کشف جهش‌های احتمالی اکتاو تعبیه شده و مستقل از ماژول تحلیل تحریر آوازی است.
          </p>
        </div>
      </section>

      {/* بخش ۴: دستورالعمل ۴ مرحله‌ای برای ارزیابی حنجره کاربر */}
      <section className="bg-stone-900 text-stone-100 rounded-xl p-6 space-y-5">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
            پروتکل ارزیابی عملی
          </span>
          <h2 className="text-base font-bold text-white">
            دستورالعمل چهارگانه آزمون میکروفون (Microphone QA Protocols)
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            برای اطمینان از عملکرد الگوریتم، چهار تست زیر را یکی پس از دیگری انجام داده و دکمه ثبت نتیجه را بزنید.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Test A */}
          <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-bold text-amber-400 block text-sm">Test A — سکوت (Silence)</span>
              <p className="text-stone-300 leading-relaxed">
                ۳ ثانیه کاملاً سکوت کنید. نباید تنفس یا فن لپ‌تاپ به عنوان نت تشخیص داده شود.
              </p>
              <div className="p-2 bg-stone-900/60 rounded text-[11px] text-stone-400 font-mono">
                انتظار: Voiced = false
              </div>
            </div>
            <button
              onClick={() => handleLogUserTest('A')}
              className="w-full py-1.5 rounded-lg bg-stone-700 hover:bg-amber-400 hover:text-stone-950 font-bold transition-colors"
            >
              ثبت وضعیت سکوت
            </button>
          </div>

          {/* Test B */}
          <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-bold text-amber-400 block text-sm">Test B — نت ممتد (Sustained)</span>
              <p className="text-stone-300 leading-relaxed">
                یک صدای کشیده «آآآآ» به مدت ۳ تا ۵ ثانیه با حجم یکنواخت بخوانید.
              </p>
              <div className="p-2 bg-stone-900/60 rounded text-[11px] text-stone-400 font-mono">
                انتظار: فرکانس پایدار و Confidence بالا
              </div>
            </div>
            <button
              onClick={() => handleLogUserTest('B')}
              className="w-full py-1.5 rounded-lg bg-stone-700 hover:bg-amber-400 hover:text-stone-950 font-bold transition-colors"
            >
              ثبت نت کشیده
            </button>
          </div>

          {/* Test C */}
          <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-bold text-amber-400 block text-sm">Test C — نت زیرتر (Higher Note)</span>
              <p className="text-stone-300 leading-relaxed">
                چند پرده بالاتر بخوانید (مثلاً سل یا لا) و بررسی کنید جهش ناگهانی اکتاو رخ ندهد.
              </p>
              <div className="p-2 bg-stone-900/60 rounded text-[11px] text-stone-400 font-mono">
                انتظار: بدون خطای جهش اکتاو
              </div>
            </div>
            <button
              onClick={() => handleLogUserTest('C')}
              className="w-full py-1.5 rounded-lg bg-stone-700 hover:bg-amber-400 hover:text-stone-950 font-bold transition-colors"
            >
              ثبت نت زیرتر
            </button>
          </div>

          {/* Test D */}
          <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-bold text-amber-400 block text-sm">Test D — نت بم‌تر (Lower Note)</span>
              <p className="text-stone-300 leading-relaxed">
                صدای خود را به گستره بم (حدود ۱۵۰ تا ۲۵۰ هرتز) ببرید و پایداری پریود را بسنجید.
              </p>
              <div className="p-2 bg-stone-900/60 rounded text-[11px] text-stone-400 font-mono">
                انتظار: تفکیک صحیح تا فرکانس‌های زیر ۱۰۰Hz
              </div>
            </div>
            <button
              onClick={() => handleLogUserTest('D')}
              className="w-full py-1.5 rounded-lg bg-stone-700 hover:bg-amber-400 hover:text-stone-950 font-bold transition-colors"
            >
              ثبت نت بم‌تر
            </button>
          </div>
        </div>
      </section>

      {/* بخش ۵: نمونه‌برداری آزمون (Sampling Session) و محاسبه آماری شاخص‌ها */}
      <section className="bg-white rounded-xl border border-stone-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-600" />
              <span>۵. نمونه‌برداری آماری و سنجش پایداری فرکانس (Pitch Sampling & Stability)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              ضبط سری زمانی نمونه‌های صوت و استخراج انحراف معیار، میانه و پایداری صدا
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isSamplingActive ? (
              <button
                onClick={handleStartSampling}
                disabled={!microphoneManager.isRecording()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>شروع نمونه‌برداری (START TEST)</span>
              </button>
            ) : (
              <button
                onClick={handleStopSampling}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors animate-pulse"
              >
                <Square className="w-3.5 h-3.5" />
                <span>توقف و محاسبه شاخص‌ها (STOP TEST)</span>
              </button>
            )}
          </div>
        </div>

        {/* نتایج آماری استخراج‌شده */}
        {samplingStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-[10px] text-stone-400 block mb-0.5">تعداد نمونه‌ها و مدت زمان</span>
              <span className="font-mono font-bold text-stone-900">
                {samplingStats.count} نمونه ({samplingStats.durationSec} ثانیه)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-stone-400 block mb-0.5">میانگین و میانه فرکانس</span>
              <span className="font-mono font-bold text-stone-900">
                {samplingStats.avgFreq} Hz (میانه: {samplingStats.medianFreq} Hz)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-stone-400 block mb-0.5">بازه ارتعاش (Min - Max)</span>
              <span className="font-mono font-bold text-stone-900">
                {samplingStats.minFreq} Hz - {samplingStats.maxFreq} Hz
              </span>
            </div>

            <div>
              <span className="text-[10px] text-stone-400 block mb-0.5">شاخص ناپایداری (Std Dev σ)</span>
              <span className="font-mono font-bold text-stone-900">
                ±{samplingStats.stabilityStdDev} Hz ({samplingStats.voicedPercentage}% واک‌دار)
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-stone-300 text-center text-xs text-stone-400">
            برای اندازه‌گیری پایداری حنجره، ابتدا میکروفون را فعال کرده و دکمه «شروع نمونه‌برداری» را بزنید.
          </div>
        )}
      </section>

      {/* بخش ۶: جدول سوابق کالیبراسیون آزمون کاربر */}
      <section className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>۶. کارنامه سوابق آزمون‌های ثبت‌شده کاربر (User Calibration Log)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              نتایج اندازه‌گیری‌های واقعی ثبت‌شده طی دستورالعمل‌های ۴ گانه
            </p>
          </div>

          {userCalibrationLogs.length > 0 && (
            <button
              onClick={() => setUserCalibrationLogs([])}
              className="text-xs text-rose-600 hover:underline"
            >
              پاک کردن جدول
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border border-stone-200 rounded-lg overflow-hidden">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-2.5">عنوان آزمون</th>
                <th className="p-2.5">شرح و انتظار</th>
                <th className="p-2.5">فرکانس ثبت‌شده</th>
                <th className="p-2.5">انحراف سنت</th>
                <th className="p-2.5">قطعیت</th>
                <th className="p-2.5">واک</th>
                <th className="p-2.5">توضیحات و سنجش</th>
                <th className="p-2.5 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {userCalibrationLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-stone-400 font-sans">
                    هنوز تستی ثبت نشده است. از بخش پروتکل‌های چهارگانه بالا دکمه‌های «ثبت» را کلیک کنید.
                  </td>
                </tr>
              ) : (
                userCalibrationLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-stone-50/60 font-sans">
                    <td className="p-2.5 font-bold text-stone-900">{entry.testName}</td>
                    <td className="p-2.5 text-stone-500 text-[11px]">{entry.expectedDescription}</td>
                    <td className="p-2.5 font-mono font-bold text-stone-900">
                      {entry.measuredFrequencyHz > 0 ? `${entry.measuredFrequencyHz} Hz` : '۰ Hz'}
                    </td>
                    <td className="p-2.5 font-mono text-stone-700">
                      {entry.centsDeviation !== 0 ? `${entry.centsDeviation}¢` : '—'}
                    </td>
                    <td className="p-2.5 font-mono">{entry.confidence}%</td>
                    <td className="p-2.5 font-mono">{entry.voiced ? 'Voiced' : 'Unvoiced'}</td>
                    <td className="p-2.5 text-stone-600 text-[11px]">{entry.note}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* بخش ۷: پروفایل‌های کوک مرجع و یادداشت موسیقی‌شناسی */}
      <section className="bg-amber-50/60 rounded-xl border border-amber-200/80 p-5 space-y-3 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>یادداشت علمی پیرامون Reference Tuning Profiles</span>
        </div>
        <p className="leading-relaxed">
          در این آزمایشگاه سه پروفایل کوک مرجع قرار دارند: «مدل ۲۴ ربع‌پرده‌ای معتدل وزیری (24-TET)»، «پروفایل سنتی مدال شور سل (با لا کُرُن ~۱۴۵ سنت هرمز فرهت)» و «پروفایل مدال سه‌گاه (با سوم خنثی می کُرُن)». این پروفایل‌ها جهت داوری و سنجش انحراف سنت کاربر استفاده می‌شوند و هیچ‌کدام به عنوان «تنها حقیقت قطعی و ریاضی ردیف» معرفی نمی‌شوند؛ زیرا در اجرای اساتید سنتی، ریزپرده‌ها بر حسب دانگ و سیر ملودی شناوری طبیعی دارند.
        </p>
      </section>
    </div>
  );
};
