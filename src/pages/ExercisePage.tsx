/**
 * کارگاه تمرین صوتی و تحلیل زنده گام (Exercise & Ear Training Workshop)
 * تفکیک صریح میان:
 * 1. listening -> Ear Training Quiz UI (تمرین شنیداری بدون نیاز به میکروفون)
 * 2. single_note -> Microphone + Pitch (تمرین صوتی تک‌نت)
 * 3. melody_phrase -> Microphone + Phrase Exercise (تمرین صوتی فراز ردیف)
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  CheckCircle2,
  RotateCcw,
  Award,
  Volume2,
  ArrowLeft,
  ArrowRight,
  Play,
  Sparkles,
  BookOpen,
  Info,
  Compass,
  Sliders,
  Headphones,
} from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import { Exercise, ExerciseTargetNote } from '../types/music';
import { PersianTuner } from '../components/PersianTuner';
import { EarTrainingQuiz } from '../components/EarTrainingQuiz';
import { ProgressStorage } from '../services/storage';
import { persianSynth } from '../services/audio/synthPlayer';
import { microphoneManager } from '../services/audio/microphoneManager';
import {
  SHOUR_MODAL_PROFILE,
  SEGAH_MODAL_PROFILE,
  VAZIRI_24TET_PROFILE,
} from '../services/audio/pitch/tuningProfiles';

interface ExercisePageProps {
  initialExerciseId?: string | null;
  onNavigate: (path: string) => void;
}

export const ExercisePage: React.FC<ExercisePageProps> = ({
  initialExerciseId = null,
  onNavigate,
}) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    initialExerciseId || EXERCISES[0].id
  );
  const [mode, setMode] = useState<'exercise' | 'free_tuner'>('exercise');
  const [categoryFilter, setCategoryFilter] = useState<'shour' | 'all'>('shour');
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [exerciseResult, setExerciseResult] = useState<{
    score: number;
    passed: boolean;
    averageCents: number;
  } | null>(null);

  const currentExercise = EXERCISES.find((e) => e.id === selectedExerciseId) || EXERCISES[0];
  const isListeningType = currentExercise.type === 'listening';

  const targetNote: ExerciseTargetNote | null =
    mode === 'exercise' && !isListeningType
      ? currentExercise.targetNotes[currentNoteIndex] || null
      : null;

  // تنظیم پروفایل کوک متناظر با تمرین و قطع میکروفون در تمرین‌های شنیداری
  useEffect(() => {
    if (isListeningType) {
      // در تمرین شنیداری میکروفون نباید فعال باشد
      microphoneManager.stop();
    } else {
      if (currentExercise.tuningProfileId === 'shour_modal') {
        microphoneManager.setTuningProfile(SHOUR_MODAL_PROFILE);
      } else if (currentExercise.tuningProfileId === 'segah_modal') {
        microphoneManager.setTuningProfile(SEGAH_MODAL_PROFILE);
      } else {
        microphoneManager.setTuningProfile(VAZIRI_24TET_PROFILE);
      }
    }
  }, [currentExercise, isListeningType]);

  useEffect(() => {
    if (initialExerciseId) {
      setSelectedExerciseId(initialExerciseId);
      setMode('exercise');
      setCurrentNoteIndex(0);
      setExerciseResult(null);
    }
  }, [initialExerciseId]);

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    setMode('exercise');
    setCurrentNoteIndex(0);
    setExerciseResult(null);
  };

  const handleMatchSuccess = (score: number, avgCents: number) => {
    // اگر هنوز نتهای دیگری در تمرین هست، به نت بعدی برو
    if (currentNoteIndex < currentExercise.targetNotes.length - 1) {
      setCurrentNoteIndex((prev) => prev + 1);
    } else {
      // تمرین به پایان رسید
      const passed = score >= currentExercise.passingScore;
      setExerciseResult({ score, passed, averageCents: avgCents });

      // ذخیره نتیجه در تاریخچه پیشرفت
      ProgressStorage.recordPracticeAttempt({
        exerciseId: currentExercise.id,
        score,
        averageCentsDeviation: avgCents,
        durationSeconds: 30,
        passed,
        attemptType: 'microphone_pitch',
      });
    }
  };

  const handleRestartExercise = () => {
    setCurrentNoteIndex(0);
    setExerciseResult(null);
  };

  // پخش نمونه صوتی نت فعلی با رعایت اولویت فرکانس و حفظ اکتاو
  const handlePlayCurrentTargetNote = async () => {
    if (!targetNote) return;
    await persianSynth.playNote({
      note: targetNote.noteFa,
      frequency: targetNote.frequencyHz,
    }, 1.8);
  };

  // پخش کل فراز ملودی با سنتور
  const playEntireExerciseMelody = async () => {
    const seq = currentExercise.targetNotes.map((n) => ({
      note: n.noteFa,
      duration: 1.2,
      frequency: n.frequencyHz,
    }));
    await persianSynth.playMelody(seq);
  };

  const filteredExercises = categoryFilter === 'shour'
    ? EXERCISES.filter((e) => e.dastgahId === 'shour')
    : EXERCISES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-28 text-stone-900">
      {/* دکمه بازگشت به دستگاه شور */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/dastgahs/shour')}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به مسیر آموزشی دستگاه شور</span>
        </button>

        <div className="flex items-center gap-2">
          {isListeningType ? (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              <span>تمرین شنیداری (بدون نیاز به میکروفون)</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>تمرین صوتی (با میکروفون)</span>
            </span>
          )}
        </div>
      </div>

      {/* سربرگ صفحه کارگاه */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
            {isListeningType ? 'کارگاه تربیت شنوایی و درک فواصل' : 'کارگاه عملی آکوستیک و سنجش حنجره'}
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {isListeningType ? 'تمرین شنیداری و تمایز فواصل ردیف' : 'کارگاه تمرین صوتی و تحلیل زنده گام'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            {isListeningType
              ? 'الگوی صوتی ساز را با گوش بشنوید و گزینه‌ها را پاسخ دهید. در این بخش نیازی به میکروفون نیست.'
              : 'صدای خود را بشنوید، زمزمه کنید و در برابر میکروفون بخوانید. سامانه انحراف سنت و پایداری صدا را می‌سنجد.'}
          </p>
        </div>

        {/* انتخابگر حالت کارگاه */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg shrink-0">
          <button
            onClick={() => setMode('exercise')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'exercise'
                ? 'bg-white text-stone-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            تمرین‌های مدون شور
          </button>
          <button
            onClick={() => {
              setMode('free_tuner');
              setExerciseResult(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'free_tuner'
                ? 'bg-white text-stone-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            تیونر آزاد سنتی
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ستون راست و میانی: تیونر یا کوییز شنیداری */}
        <div className="lg:col-span-2 space-y-6">
          {/* حالت ۱: تمرین شنیداری (EAR TRAINING QUIZ UI) */}
          {mode === 'exercise' && isListeningType ? (
            <EarTrainingQuiz
              exercise={currentExercise}
              onNavigateLesson={() => onNavigate('/dastgahs/shour')}
            />
          ) : (
            /* حالت ۲ و ۳: تمرین صوتی با میکروفون (تک‌نت یا فراز ردیف) یا تیونر آزاد */
            <>
              {mode === 'exercise' && (
                <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {currentExercise.musicalContext === 'radif_phrase'
                          ? 'آموزش ردیف: فراز ملودیک'
                          : 'تمرین صوتی: تثبیت فرکانس تک‌نت'}
                      </span>
                      <h2 className="font-extrabold text-sm sm:text-base text-stone-900">
                        {currentExercise.titleFa}
                      </h2>
                    </div>

                    <button
                      onClick={handlePlayCurrentTargetNote}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
                      title="شنیدن فرکانس دقیق سنتور پیش از خواندن"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>شنیدن نت هدف با سنتور</span>
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {currentExercise.descriptionFa}
                  </p>
                </div>
              )}

              {/* کامپوننت تیونر اصلی برای تمرین‌های صوتی */}
              <PersianTuner
                targetNote={targetNote}
                onMatchSuccess={handleMatchSuccess}
                showCanvasGraph={true}
              />

              {/* کارت ثبت و بازخورد نتیجه تمرین صوتی */}
              {exerciseResult && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          exerciseResult.passed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-stone-900">
                          {exerciseResult.passed ? 'تمرین صوتی با موفقیت انجام شد!' : 'نیاز به تکرار و تمرکز بیشتر'}
                        </h3>
                        <span className="text-xs text-stone-500">
                          نتیجه در کارنامه آموزشی شما ثبت شد
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleRestartExercise}
                      className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>تکرار مجدد تمرین</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
                    <div>
                      <span className="text-xs text-stone-500 block">امتیاز کسب‌شده</span>
                      <span className="text-2xl font-black text-amber-600 font-mono">
                        {exerciseResult.score} / ۱۰۰
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 block">میانگین خطای فرکانسی</span>
                      <span className="text-2xl font-black text-stone-800 font-mono">
                        ±{exerciseResult.averageCents} سنت
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* استپر گام‌های نغمات هدف در تمرین صوتی */}
              {mode === 'exercise' && (
                <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-stone-900">
                      توالی نغمات این تمرین (پله {currentNoteIndex + 1} از {currentExercise.targetNotes.length})
                    </h3>
                    <button
                      onClick={playEntireExerciseMelody}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>پخش کل الگو با سنتور</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {currentExercise.targetNotes.map((note, idx) => {
                      const isCurrent = idx === currentNoteIndex;
                      const isPassed = idx < currentNoteIndex;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            isCurrent
                              ? 'bg-amber-50 border-amber-500 shadow-sm ring-1 ring-amber-400'
                              : isPassed
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                              : 'bg-stone-50 border-stone-200 text-stone-500'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                            <span>پله {idx + 1}</span>
                            {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <span className="font-bold text-sm text-stone-900 block">
                            {note.noteFa}
                          </span>
                          <span className="text-[11px] font-mono text-stone-500 block mt-0.5">
                            {Math.round(note.frequencyHz * 10) / 10} Hz
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ستون چپ: فهرست تمرین‌ها و راهنمای آموزشی */}
        <div className="space-y-6">
          {/* جعبه راهنمای گام‌به‌گام */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>مراحل اجرای صحیح</span>
            </h3>
            <ul className="space-y-2 text-xs text-stone-600 leading-relaxed list-decimal list-inside">
              {currentExercise.instructionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>

          {/* فهرست تمرین‌ها با فیلتر دستگاه شور */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">فهرست تمرین‌ها</h3>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setCategoryFilter('shour')}
                  className={`px-2 py-0.5 rounded font-bold ${
                    categoryFilter === 'shour'
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  تمرین‌های شور
                </button>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2 py-0.5 rounded font-bold ${
                    categoryFilter === 'all'
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  همه
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pl-1">
              {filteredExercises.map((ex) => {
                const isSelected = selectedExerciseId === ex.id && mode === 'exercise';
                const isExListening = ex.type === 'listening';

                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex.id)}
                    className={`w-full text-right p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-400 shadow-xs ring-1 ring-amber-300'
                        : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-stone-900 block truncate">
                        {ex.titleFa}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                          isExListening
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : ex.musicalContext === 'radif_phrase'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-sky-100 text-sky-900 border border-sky-200'
                        }`}
                      >
                        {isExListening
                          ? 'تمرین شنیداری'
                          : ex.musicalContext === 'radif_phrase'
                          ? 'تمرین ردیف'
                          : 'تمرین تک‌نت'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {ex.descriptionFa}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
